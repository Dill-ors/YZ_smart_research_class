import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import DataService from '../services/dataService';

const Settings = () => {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleExport = async () => {
    try {
      const dataToExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        surveys: await DataService._getAllSurveysRaw(),
        reports: await DataService.getReports(),
        users: await DataService.getAllUsers(),
        targets: await DataService.getTargets(),
        responses: await DataService.getResponses()
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      link.download = `survey_system_backup_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: '数据导出成功！请妥善保存您的备份文件。' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Export Error:', error);
      setMessage({ type: 'error', text: '导出失败：' + error.message });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          // Basic validation
          if (typeof importedData !== 'object' || (!importedData.surveys && !importedData.users)) {
            throw new Error('无效的备份文件格式，未找到预期的系统数据。');
          }

          // Restore to backend
          await DataService.restoreData(importedData);

          setMessage({ type: 'success', text: '数据恢复成功！系统即将刷新以加载最新数据...' });
          
          // Reload page to apply new data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Import Error:', error);
          setMessage({ type: 'error', text: '恢复失败：' + error.message });
        }
        
        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
    
    reader.onerror = () => {
      setMessage({ type: 'error', text: '读取文件失败，请检查文件是否损坏。' });
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">管理系统偏好设置和数据备份</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            数据备份与恢复
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            当前系统采用纯前端存储架构。为了防止清理浏览器缓存导致数据丢失，建议您定期导出数据备份到本地。
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Export Section */}
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-medium text-gray-900">导出备份 (Export)</h3>
              <p className="text-sm text-gray-500">
                将当前浏览器中的所有问卷数据、听课记录、用户账号等核心数据打包成 JSON 文件，并下载到您的电脑本地。
              </p>
            </div>
            <div className="md:w-48 flex-shrink-0">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                导出备份
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Import Section */}
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-medium text-gray-900">恢复数据 (Import)</h3>
              <p className="text-sm text-gray-500">
                选择之前导出的 JSON 备份文件。恢复操作将覆盖当前浏览器中的所有现有数据。建议在操作前先执行一次“导出备份”。
              </p>
              <div className="flex items-start mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                <Info className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                <span>警告：恢复操作不可逆，将直接覆盖当前系统中的数据。恢复成功后系统将自动刷新。</span>
              </div>
            </div>
            <div className="md:w-48 flex-shrink-0">
              <input
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2 text-gray-500" />
                选择文件恢复
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
