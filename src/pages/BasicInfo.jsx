import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BookOpen, 
  Users, 
  Plus, 
  Search
} from 'lucide-react';
import dataService from '../services/dataService';

export default function BasicInfo() {
  const [activeTab, setActiveTab] = useState('schools'); // schools, subjects, groups
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">基础信息管理</h1>
          <p className="text-gray-500 mt-1">管理系统的学校、学科以及人员分组信息</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('schools')}
              className={`py-4 px-6 inline-flex items-center font-medium border-b-2 transition-colors ${
                activeTab === 'schools'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-5 h-5 mr-2" />
              学校管理
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-4 px-6 inline-flex items-center font-medium border-b-2 transition-colors ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              学科管理
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-6 inline-flex items-center font-medium border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              人员分组管理
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'schools' && <SchoolManagement />}
          {activeTab === 'subjects' && <SubjectManagement />}
          {activeTab === 'groups' && <GroupManagement />}
        </div>
      </div>
    </div>
  );
}

function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSchool, setCurrentSchool] = useState(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    const data = dataService.getSchools ? await dataService.getSchools() : [];
    setSchools(data);
  };

  const handleSave = async () => {
    if (!currentSchool?.name?.trim()) return;
    
    const existing = schools.filter(s => s.id !== currentSchool.id);
    const newSchool = currentSchool.id 
      ? currentSchool 
      : { ...currentSchool, id: Date.now().toString(), createdAt: new Date().toISOString() };
      
    const updated = [...existing, newSchool];
    try {
        if (dataService.saveSchools) {
          await dataService.saveSchools([newSchool]); // 只需要保存这一个或者传全部都行，但 server 接口是处理单个 item
        }
        
        // 重新加载数据以确保一致性
        if (dataService.getSchools) {
            const freshData = await dataService.getSchools();
            setSchools(freshData);
        }
        
        setIsEditing(false);
        setCurrentSchool(null);
    } catch (err) {
        alert("保存学校信息失败，请检查后端服务是否正常运行 (node server.js)\n" + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这所学校吗？')) return;
    try {
        if (dataService.deleteSchool) {
          await dataService.deleteSchool(id);
        } else if (dataService.saveSchools) {
          const updated = schools.filter(s => s.id !== id);
          await dataService.saveSchools(updated);
        }
        
        if (dataService.getSchools) {
            const freshData = await dataService.getSchools();
            setSchools(freshData);
        }
    } catch (err) {
        alert("删除失败，请检查后端服务: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="搜索学校..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          onClick={() => {
            setCurrentSchool({ id: '', name: '', region: '', type: '高中' });
            setIsEditing(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增学校
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            {currentSchool.id ? '编辑学校' : '新增学校'}
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
              <input
                type="text"
                value={currentSchool.name}
                onChange={e => setCurrentSchool({...currentSchool, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在区域</label>
              <input
                type="text"
                value={currentSchool.region}
                onChange={e => setCurrentSchool({...currentSchool, region: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学段类型</label>
              <select
                value={currentSchool.type}
                onChange={e => setCurrentSchool({...currentSchool, type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="高中">高中</option>
                <option value="初中">初中</option>
                <option value="小学">小学</option>
                <option value="九年一贯制">九年一贯制</option>
                <option value="十二年一贯制">十二年一贯制</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学校名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在区域</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学段类型</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">暂无学校数据</td>
              </tr>
            ) : (
              schools.map(school => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{school.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.region || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {school.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentSchool(school);
                        setIsEditing(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const data = dataService.getSubjects ? await dataService.getSubjects() : [];
    setSubjects(data);
  };

  const handleSave = async () => {
    if (!currentSubject?.name?.trim()) return;
    
    const existing = subjects.filter(s => s.id !== currentSubject.id);
    const newSubject = currentSubject.id 
      ? currentSubject 
      : { ...currentSubject, id: Date.now().toString(), createdAt: new Date().toISOString() };
      
    const updated = [...existing, newSubject];
    try {
        if (dataService.saveSubjects) {
          await dataService.saveSubjects([newSubject]);
        }
        
        if (dataService.getSubjects) {
            const freshData = await dataService.getSubjects();
            setSubjects(freshData);
        }
        
        setIsEditing(false);
        setCurrentSubject(null);
    } catch (err) {
        alert("保存学科信息失败，请检查后端服务是否正常运行\n" + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个学科吗？')) return;
    try {
        if (dataService.deleteSubject) {
          await dataService.deleteSubject(id);
        } else if (dataService.saveSubjects) {
          const updated = subjects.filter(s => s.id !== id);
          await dataService.saveSubjects(updated);
        }
        
        if (dataService.getSubjects) {
            const freshData = await dataService.getSubjects();
            setSubjects(freshData);
        }
    } catch (err) {
        alert("删除失败，请检查后端服务: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="搜索学科..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          onClick={() => {
            setCurrentSubject({ id: '', name: '', code: '', type: '通用' });
            setIsEditing(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增学科
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            {currentSubject.id ? '编辑学科' : '新增学科'}
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学科名称</label>
              <input
                type="text"
                value={currentSubject.name}
                onChange={e => setCurrentSubject({...currentSubject, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学科代码</label>
              <input
                type="text"
                value={currentSubject.code}
                onChange={e => setCurrentSubject({...currentSubject, code: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">适用学段</label>
              <select
                value={currentSubject.type}
                onChange={e => setCurrentSubject({...currentSubject, type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="通用">通用</option>
                <option value="高中">仅高中</option>
                <option value="初中">仅初中</option>
                <option value="小学">仅小学</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学科名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学科代码</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">适用学段</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">暂无学科数据</td>
              </tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {subject.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentSubject(subject);
                        setIsEditing(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const groupData = dataService.getUserGroups ? await dataService.getUserGroups() : [];
    setGroups(groupData);
    
    // 加载系统用户以供选择
    const userData = dataService.getAllUsers ? await dataService.getAllUsers() : [];
    setUsers(userData);
  };

  const handleSave = async () => {
    if (!currentGroup?.name?.trim()) return;
    
    const existing = groups.filter(g => g.id !== currentGroup.id);
    const newGroup = currentGroup.id 
      ? currentGroup 
      : { ...currentGroup, id: Date.now().toString(), createdAt: new Date().toISOString() };
      
    const updated = [...existing, newGroup];
    try {
        if (dataService.saveUserGroups) {
          await dataService.saveUserGroups([newGroup]);
        }
        
        if (dataService.getUserGroups) {
            const freshData = await dataService.getUserGroups();
            setGroups(freshData);
        }
        
        setIsEditing(false);
        setCurrentGroup(null);
    } catch (err) {
        alert("保存分组信息失败，请检查后端服务是否正常运行\n" + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该人员分组吗？')) return;
    try {
        if (dataService.deleteUserGroup) {
          await dataService.deleteUserGroup(id);
        } else if (dataService.saveUserGroups) {
          const updated = groups.filter(g => g.id !== id);
          await dataService.saveUserGroups(updated);
        }
        
        if (dataService.getUserGroups) {
            const freshData = await dataService.getUserGroups();
            setGroups(freshData);
        }
    } catch (err) {
        alert("删除失败，请检查后端服务: " + err.message);
    }
  };

  const toggleUserSelection = (userId) => {
    if (!currentGroup) return;
    
    const members = currentGroup.members || [];
    if (members.includes(userId)) {
      setCurrentGroup({
        ...currentGroup,
        members: members.filter(id => id !== userId)
      });
    } else {
      setCurrentGroup({
        ...currentGroup,
        members: [...members, userId]
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="搜索分组..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          onClick={() => {
            setCurrentGroup({ id: '', name: '', description: '', members: [] });
            setIsEditing(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增分组
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            {currentGroup.id ? '编辑人员分组' : '新增人员分组'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分组名称</label>
              <input
                type="text"
                value={currentGroup.name}
                onChange={e => setCurrentGroup({...currentGroup, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分组描述</label>
              <input
                type="text"
                value={currentGroup.description}
                onChange={e => setCurrentGroup({...currentGroup, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">小组成员 (选择系统用户)</label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white p-2">
              {users.length === 0 ? (
                <div className="text-center text-gray-500 p-2">暂无系统用户数据</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100">
                      <input
                        type="checkbox"
                        checked={(currentGroup.members || []).includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.role} | {user.school || '无学校'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分组名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成员人数</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">暂无人员分组数据</td>
              </tr>
            ) : (
              groups.map(group => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{group.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {(group.members || []).length} 人
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentGroup(group);
                        setIsEditing(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
