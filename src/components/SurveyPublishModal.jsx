import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Tag } from 'lucide-react';
import DataService from '../services/dataService';

export default function SurveyPublishModal({ survey, onClose, onPublish }) {
  const [publishType, setPublishType] = useState('immediate'); // immediate, scheduled
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [surveyTimeType, setSurveyTimeType] = useState('single'); // single, range
  const [surveyTime, setSurveyTime] = useState(new Date().toISOString().split('T')[0]);
  const [surveyTimeEnd, setSurveyTimeEnd] = useState(new Date().toISOString().split('T')[0]);
  const [surveySchool, setSurveySchool] = useState('');
  const [surveyResearchers, setSurveyResearchers] = useState([]);
  
  const [targetType, setTargetType] = useState('all'); // all, role, school, user, group
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const ROLES = ['教师', '区调研员', '区主任', '校长'];

  useEffect(() => {
    const fetchData = async () => {
      const users = await DataService.getAllUsers();
      setAllUsers(users);
      
      if (DataService.getUserGroups) {
        const groups = DataService.getUserGroups();
        setAllGroups(groups);
      }
      
      if (DataService.getSchools) {
        setSchools(DataService.getSchools().map(s => s.name));
      }
      
      if (DataService.getSubjects) {
        setSubjects(['全部', ...DataService.getSubjects().map(s => s.name)]);
      }
    };
    fetchData();
  }, []);

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredTeachers = allUsers.filter(u => u.role === 'teacher' && (subjectFilter === '' || subjectFilter === '全部' || u.subject === subjectFilter));
  
  // Also get principals for selection if needed
  const principals = allUsers.filter(u => u.role === 'principal');
  const directors = allUsers.filter(u => u.role === "district_director");
  const researchers = allUsers.filter(u => u.role === "district_researcher");
  const availableUsers = [...filteredTeachers, ...principals, ...directors, ...researchers];

  const handleConfirm = () => {
    const publishConfig = {
      publishType,
      scheduleTime: publishType === 'scheduled' ? scheduleTime : new Date().toISOString(),
      surveyTimeType,
      surveyTime,
      surveyTimeEnd: surveyTimeType === 'range' ? surveyTimeEnd : null,
      surveySchool,
      surveyResearchers,
      target: {
        type: targetType,
        roles: selectedRoles,
        schools: selectedSchools,
        userIds: selectedUsers,
        groupIds: selectedGroups
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
          {/* Survey Attributes */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" /> 问卷属性设置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">调研时间</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={surveyTimeType}
                    onChange={(e) => setSurveyTimeType(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-32"
                  >
                    <option value="single">具体某一天</option>
                    <option value="range">阶段时间</option>
                  </select>
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="date" 
                      value={surveyTime}
                      onChange={(e) => setSurveyTime(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {surveyTimeType === 'range' && (
                      <>
                        <span className="text-gray-500">至</span>
                        <input 
                          type="date" 
                          value={surveyTimeEnd}
                          onChange={(e) => setSurveyTimeEnd(e.target.value)}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">调研学校</label>
                <select 
                  value={surveySchool}
                  onChange={(e) => setSurveySchool(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择学校</option>
                  {schools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">参与调研教研员</label>
                <div className="flex flex-wrap gap-2">
                  {researchers.map(r => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 border rounded-full text-sm">
                      <input 
                        type="checkbox" 
                        checked={surveyResearchers.includes(r.id)}
                        onChange={() => toggleSelection(r.id, surveyResearchers, setSurveyResearchers)}
                        className="text-blue-600 rounded"
                      />
                      <span>{r.name}</span>
                    </label>
                  ))}
                  {researchers.length === 0 && <span className="text-sm text-gray-500">暂无教研员数据</span>}
                </div>
              </div>
            </div>
          </div>

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
              <option value="group">按自定义人员分组筛选</option>
              <option value="user">按具体教师人员下发</option>
            </select>

            {targetType === 'group' && (
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-md border">
                {allGroups.length > 0 ? allGroups.map(group => (
                  <label key={group.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 border rounded-md text-sm shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => toggleSelection(group.id, selectedGroups, setSelectedGroups)}
                      className="text-blue-600 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-gray-500">{group.members?.length || 0} 人</span>
                    </div>
                  </label>
                )) : (
                  <div className="text-sm text-gray-500">暂无人员分组数据，请先在“基础信息”模块中创建</div>
                )}
              </div>
            )}

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
                {schools.map(school => (
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

            {targetType === 'user' && (
              <div className="p-4 bg-gray-50 rounded-md border space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mr-2">按学科筛选:</label>
                  <select 
                    value={subjectFilter} 
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                  {availableUsers.length > 0 ? availableUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border rounded-md text-sm shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelection(user.id, selectedUsers, setSelectedUsers)}
                        className="text-blue-600 rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.school}{user.subject ? ` - ${user.subject}` : ''}</span>
                      </div>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-500">该条件下没有找到教师</div>
                  )}
                </div>
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
