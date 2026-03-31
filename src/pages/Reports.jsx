import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, BarChart2, CheckCircle, Clock, 
  Settings, Trash2, Edit3, XCircle, RotateCcw, Activity,
  Download, Upload
} from 'lucide-react';
import SurveyEngine from '../components/SurveyEngine';
import SurveyPublishModal from '../components/SurveyPublishModal';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';
import DataService from '../services/dataService';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // list, create, edit, board
  const [currentSurvey, setCurrentSurvey] = useState(null);
  
  const [filterTimeType, setFilterTimeType] = useState('single');
  const [filterTime, setFilterTime] = useState('');
  const [filterTimeEnd, setFilterTimeEnd] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [surveyToPublish, setSurveyToPublish] = useState(null);

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [schools, setSchools] = useState([]);
  
  const fileInputRef = useRef(null);

  const handleExportSurvey = (report) => {
    try {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey_template_${report.title || 'export'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败');
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportSurvey = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        const newSurvey = {
          ...importedData,
          id: Date.now().toString(),
          title: importedData.title ? `${importedData.title} (导入)` : '导入的问卷',
          status: 'draft',
          created_at: new Date().toISOString().split('T')[0],
          publishConfig: null
        };

        await DataService.saveReport(newSurvey);
        setReports(prev => [newSurvey, ...prev]);
        alert('导入成功！');
      } catch (error) {
        console.error('Import Error:', error);
        alert('导入失败，请检查文件格式是否正确。');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchedReports = await DataService.getReports({ currentUser: user });
      setReports(fetchedReports);
      const fetchedResponses = await DataService.getResponses();
      setAllResponses(fetchedResponses);
      setLoading(false);
    };
    loadData();
    if (DataService.getSchools) {
      setSchools(DataService.getSchools().map(s => s.name));
    }
  }, [user]);

  // Refetch responses when entering board mode to ensure latest data
  useEffect(() => {
    if (activeTab === 'board') {
      DataService.getResponses().then(fetchedResponses => {
        setAllResponses(fetchedResponses);
      });
    }
  }, [activeTab]);

  const addLog = (surveyId, action, details) => {
    const newLog = {
      id: Date.now(),
      surveyId,
      action,
      details,
      operator: user?.name || 'admin',
      time: new Date().toLocaleString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleStatusChange = async (id, newStatus, actionName) => {
    if (window.confirm(`确定要${actionName}吗？`)) {
      const report = reports.find(r => r.id === id);
      if (report) {
        const updatedReport = { ...report, status: newStatus };
        await DataService.saveReport(updatedReport);
        setReports(reports.map(r => r.id === id ? updatedReport : r));
        addLog(id, actionName, `状态变更为：${newStatus}`);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这份问卷吗？删除后将无法恢复。')) {
      await DataService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    }
  };

  const handleEdit = (report) => {
    setCurrentSurvey(report);
    setActiveTab('edit');
  };

  const handleSubmitSurvey = async (answers) => {
    const report = reports.find(r => r.id === currentSurvey.id);
    if (report) {
      const updatedReport = { ...report, response_count: (report.response_count || 0) + 1 };
      await DataService.saveReport(updatedReport);
      setReports(reports.map(r => r.id === currentSurvey.id ? updatedReport : r));
    }

    const newResponse = {
      id: Date.now().toString(),
      surveyId: currentSurvey.id,
      userId: user?.username || 'anonymous',
      userName: user?.name || '匿名用户',
      role: user?.role || 'unknown',
      answers,
      time: new Date().toLocaleString()
    };
    await DataService.addResponse(newResponse);
    setAllResponses([...allResponses, newResponse]);

    localStorage.setItem(`survey_system_success_${currentSurvey.id}`, JSON.stringify(newResponse.answers));
    setActiveTab('success');
  };

  const handleSaveSurvey = async (surveyData) => {
    let updatedReport;
    if (surveyData.id) {
      updatedReport = { ...reports.find(r => r.id === surveyData.id), ...surveyData };
    } else {
      updatedReport = {
        ...surveyData,
        id: Date.now().toString(),
        status: 'draft',
        created_at: new Date().toISOString().split('T')[0],
        response_count: 0
      };
      addLog(updatedReport.id, '创建问卷', '新问卷被创建');
    }
    await DataService.saveReport(updatedReport);
    setReports(surveyData.id ? reports.map(r => r.id === surveyData.id ? updatedReport : r) : [updatedReport, ...reports]);
    setActiveTab('list');
    setCurrentSurvey(null);
  };

  const openPublishModal = (survey) => {
    setSurveyToPublish(survey);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async (config) => {
    const report = reports.find(r => r.id === surveyToPublish.id);
    if (report) {
      const updatedReport = { ...report, status: 'published', publishConfig: config };
      await DataService.saveReport(updatedReport);
      setReports(reports.map(r => r.id === surveyToPublish.id ? updatedReport : r));
      addLog(surveyToPublish.id, '发布问卷', `发布配置: ${JSON.stringify(config)}`);
    }
    setShowPublishModal(false);
    setSurveyToPublish(null);
  };

  const renderStatus = (status) => {
    const map = {
      'published': { text: '已发布', color: 'bg-green-100 text-green-800' },
      'draft': { text: '草稿', color: 'bg-yellow-100 text-yellow-800' },
      'closed': { text: '已结束', color: 'bg-gray-100 text-gray-800' },
      'recalled': { text: '已撤回', color: 'bg-red-100 text-red-800' },
    };
    const s = map[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${s.color}`}>{s.text}</span>;
  };

  if (activeTab === 'create' || activeTab === 'edit' || activeTab === 'fill' || activeTab === 'board') {
    const responses = (activeTab === 'board' || activeTab === 'fill')
      ? allResponses.filter(r => r.surveyId === currentSurvey?.id)
      : [];
    return (
        <SurveyEngine 
          key={`${activeTab}-${currentSurvey?.id}`}
          initialData={currentSurvey} 
          mode={activeTab}
          onSave={handleSaveSurvey} 
          onSubmit={handleSubmitSurvey}
          onCancel={() => { setActiveTab('list'); setCurrentSurvey(null); }} 
          onRefresh={() => DataService.getResponses().then(setAllResponses)}
          responses={responses}
          user={user}
        />
      );
  }

  if (activeTab === 'success') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">提交成功！</h2>
        <p className="text-gray-600 mb-8 text-lg">感谢您的参与，您的问卷已成功提交。</p>
        <div className="flex gap-4">
          <button onClick={() => { setActiveTab('list'); setCurrentSurvey(null); }} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
            返回列表
          </button>
          <button onClick={() => setActiveTab('board')} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-medium">
            查看问卷填写情况
          </button>
        </div>
      </div>
    );
  }

  const visibleReports = (hasPermission(user, 'canModifyStructure') || hasPermission(user, 'canViewAll') 
    ? reports 
    : reports.filter(r => {
        if (r.status !== 'published') return false;
        
        // If current user is a teacher, they should only see surveys assigned to them
        if (user && user.role === 'teacher') {
            if (!r.publishConfig || !r.publishConfig.target) return true; // Backward compatibility
            
            const target = r.publishConfig.target;
            console.log('Survey Target:', r.title, target, 'User:', user.id, user.name);
            if (target.type === 'all') return true;
            if (target.type === 'role' && target.roles.includes('教师')) return true;
            if (target.type === 'school' && target.schools.includes(user.school)) return true;
            if (target.type === 'user' && target.userIds && target.userIds.includes(user.id)) return true;
            return false;
        }
        return true;
    })).filter(r => {
        let match = true;
        if (filterTime || filterTimeEnd) {
            const pubConf = r.publishConfig;
            if (!pubConf) {
                match = false;
            } else {
                const rStart = pubConf.surveyTimeType === 'range' ? pubConf.surveyTime : pubConf.surveyTime;
                const rEnd = pubConf.surveyTimeType === 'range' ? pubConf.surveyTimeEnd : pubConf.surveyTime;
                
                if (filterTimeType === 'single') {
                    if (filterTime && (filterTime < rStart || filterTime > rEnd)) match = false;
                } else {
                    if (filterTime && rEnd < filterTime) match = false;
                    if (filterTimeEnd && rStart > filterTimeEnd) match = false;
                }
            }
        }
        if (filterSchool && r.publishConfig?.surveySchool !== filterSchool) match = false;
        return match;
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-800">集中调研</h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center">
              <label className="text-sm text-gray-600 mr-2">调研时间:</label>
              <select 
                value={filterTimeType}
                onChange={(e) => {
                  setFilterTimeType(e.target.value);
                  if (e.target.value === 'single') setFilterTimeEnd('');
                }}
                className="border border-gray-300 rounded text-sm py-1 px-2 mr-2"
              >
                <option value="single">具体某一天</option>
                <option value="range">时间段</option>
              </select>
              <input 
                type="date" 
                value={filterTime} 
                onChange={(e) => setFilterTime(e.target.value)}
                className="border border-gray-300 rounded text-sm py-1 px-2"
              />
              {filterTimeType === 'range' && (
                <>
                  <span className="mx-2 text-gray-500 text-sm">至</span>
                  <input 
                    type="date" 
                    value={filterTimeEnd} 
                    onChange={(e) => setFilterTimeEnd(e.target.value)}
                    className="border border-gray-300 rounded text-sm py-1 px-2"
                  />
                </>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600 mr-2">调研学校:</label>
              <select 
                value={filterSchool} 
                onChange={(e) => setFilterSchool(e.target.value)}
                className="border border-gray-300 rounded text-sm py-1 px-2"
              >
                <option value="">全部学校</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(filterTime || filterTimeEnd || filterSchool) && (
              <button 
                onClick={() => { setFilterTime(''); setFilterTimeEnd(''); setFilterTimeType('single'); setFilterSchool(''); }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
        {hasPermission(user, 'canModifyStructure') && (
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportSurvey} 
            />
            <button onClick={handleImportClick} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center">
              <Upload className="w-4 h-4 mr-2" /> 导入问卷
            </button>
            <button onClick={() => setShowLogsModal(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> 操作日志
            </button>
            <button 
              onClick={() => { setCurrentSurvey(null); setActiveTab('create'); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> 创建调研问卷
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调研学校</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收集数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">加载中...</td></tr>
              ) : visibleReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">{report.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.publishConfig?.surveySchool || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatus(report.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const surveyResponses = allResponses.filter(r => r.surveyId === report.id);
                      const uniqueUsers = new Set(surveyResponses.map(r => r.userId));
                      return uniqueUsers.size;
                    })()} 人已完成
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.created_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      {hasPermission(user, 'canModifyStructure') && (
                        <button onClick={() => handleExportSurvey(report)} className="text-gray-600 hover:text-gray-900" title="导出问卷">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission(user, 'canModifyStructure') && report.status === 'draft' && (
                        <>
                          <button onClick={() => handleEdit(report)} className="text-blue-600 hover:text-blue-900" title="编辑问卷"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => openPublishModal(report)} className="text-green-600 hover:text-green-900" title="发布"><CheckCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      {hasPermission(user, 'canModifyStructure') && report.status === 'published' && (
                        <>
                          <button onClick={() => handleStatusChange(report.id, 'draft', '撤回问卷')} className="text-yellow-600 hover:text-yellow-900" title="撤回未结束的问卷"><RotateCcw className="w-4 h-4" /></button>
                          <button onClick={() => handleStatusChange(report.id, 'closed', '提前收卷')} className="text-red-600 hover:text-red-900" title="手动收卷"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      {hasPermission(user, 'canModifyStructure') && report.status === 'recalled' && (
                        <>
                          <button onClick={() => handleEdit(report)} className="text-blue-600 hover:text-blue-900" title="再编辑"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => openPublishModal(report)} className="text-green-600 hover:text-green-900" title="发布"><CheckCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      {(report.status === 'published' || report.status === 'closed') && (
                        <button onClick={() => { setCurrentSurvey(report); setActiveTab('board'); }} className="text-purple-600 hover:text-purple-900" title="数据看板">
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      )}
                      {report.status === 'published' && (
                        <button onClick={() => { setCurrentSurvey(report); setActiveTab('fill'); }} className="text-green-600 hover:text-green-900 font-medium text-xs flex items-center border border-green-200 bg-green-50 px-2 py-1 rounded" title="填写问卷">
                          填写问卷
                        </button>
                      )}
                      {hasPermission(user, 'canDelete') && (
                        <button onClick={() => handleDelete(report.id)} className="text-red-400 hover:text-red-600" title="删除"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPublishModal && (
        <SurveyPublishModal 
          survey={surveyToPublish} 
          onClose={() => setShowPublishModal(false)} 
          onPublish={handlePublishConfirm} 
        />
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h2 className="text-xl font-bold">问卷操作日志</h2>
              <button onClick={() => setShowLogsModal(false)} className="text-gray-500 hover:text-gray-700">关闭</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">暂无操作日志</div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 bg-gray-50 rounded border text-sm">
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-blue-600">[{log.action}] - 问卷ID: {log.surveyId}</span>
                        <span className="text-gray-500">{log.time}</span>
                      </div>
                      <div className="text-gray-700">{log.details}</div>
                      <div className="text-gray-400 text-xs mt-2">操作人: {log.operator}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
