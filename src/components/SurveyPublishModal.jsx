import React, { useState } from 'react';
import { X, Clock, Users, Tag } from 'lucide-react';

export default function SurveyPublishModal({ survey, onClose, onPublish }) {
  const [publishType, setPublishType] = useState('immediate'); // immediate, scheduled
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [targetType, setTargetType] = useState('all'); // all, role, school, tags
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);

  const ROLES = ['教师', '区调研员', '校长'];
  const SCHOOLS = ['青岛五十三中', '市北实验初中', '青岛四中'];

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleConfirm = () => {
    const publishConfig = {
      publishType,
      scheduleTime: publishType === 'scheduled' ? scheduleTime : new Date().toISOString(),
      target: {
        type: targetType,
        roles: selectedRoles,
        schools: selectedSchools
      }
    };

    if (window.confirm(`确认要发布问卷《${survey.title}》吗？\n目标群体：${targetType === 'all' ? '全体人员' : '指定人员'}`)) {
      onPublish(publishConfig);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold">发布问卷：{survey.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Publish Time */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> 发布时间设置
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="publishType" 
                  checked={publishType === 'immediate'}
                  onChange={() => setPublishType('immediate')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>立即发布</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="publishType" 
                  checked={publishType === 'scheduled'}
                  onChange={() => setPublishType('scheduled')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>定时发布</span>
              </label>
            </div>
            {publishType === 'scheduled' && (
              <div className="mt-3">
                <input 
                  type="datetime-local" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> 发布对象选择
            </h3>
            <select 
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
            >
              <option value="all">全体人员 (无限制)</option>
              <option value="role">按角色筛选</option>
              <option value="school">按组织架构/学校筛选</option>
            </select>

            {targetType === 'role' && (
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md border">
                {ROLES.map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 border rounded-full text-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleSelection(role, selectedRoles, setSelectedRoles)}
                      className="text-blue-600 rounded"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            )}

            {targetType === 'school' && (
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md border">
                {SCHOOLS.map(school => (
                  <label key={school} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 border rounded-full text-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedSchools.includes(school)}
                      onChange={() => toggleSelection(school, selectedSchools, setSelectedSchools)}
                      className="text-blue-600 rounded"
                    />
                    <span>{school}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Warning */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
            <p className="text-sm text-yellow-700">
              提示：问卷一旦发布，将立即（或在设定时间）对目标用户可见。如需修改，可使用“撤回”或“再编辑”功能。
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">取消</button>
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            确认发布
          </button>
        </div>
      </div>
    </div>
  );
}
