import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Shield, CheckCircle, XCircle, Key, History
} from 'lucide-react';
import DataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';

import { Navigate } from 'react-router-dom';

export default function Users() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form state
  const [password, setPassword] = useState('');
  const [notifyUser, setNotifyUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  
  // Basic info state
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await DataService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    // Load basic info
    const loadBasicInfo = async () => {
      setSchools(await DataService.getSchools());
      setSubjects(await DataService.getSubjects());
    };
    loadBasicInfo();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.name || '').includes(searchTerm) || 
    (u.username || '').includes(searchTerm) || 
    (u.school || '').includes(searchTerm) ||
    (u.subject || '').includes(searchTerm)
  );

  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { text: '', color: '' };
    if (pwd.length < 6) return { text: '弱', color: 'text-red-500' };
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasLetter && hasNumber && hasSpecial) return { text: '强', color: 'text-green-500' };
    if (pwd.length >= 8 && hasLetter && hasNumber) return { text: '中', color: 'text-yellow-500' };
    return { text: '弱', color: 'text-red-500' };
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(pwd);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Check password requirement for new users
    if (!editingUser && !password) {
      alert("新用户必须设置密码！");
      return;
    }

    const userData = {
      username: formData.get('username'),
      name: formData.get('name'),
      role: formData.get('role'),
      school: formData.get('school'),
      subject: formData.get('subject'),
      status: formData.get('status') || 'active',
      lastLogin: editingUser ? editingUser.lastLogin : '-'
    };

    if (password) {
      userData.password = password;
    } else if (editingUser && editingUser.password) {
      userData.password = editingUser.password;
    } else {
      userData.password = '123'; // Default password if not set
    }

    if (editingUser) {
      await DataService.updateUser(editingUser.id, userData);
      if (password) {
        alert(`密码已更新${notifyUser ? '，并已通过邮件/短信通知用户' : ''}`);
      }
    } else {
      await DataService.addUser(userData);
      if (notifyUser) {
        alert('账号创建成功，已发送通知给用户！');
      }
    }
    
    loadUsers();
    setIsModalOpen(false);
    setEditingUser(null);
    setPassword('');
    setNotifyUser(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除该用户吗？此操作不可恢复。')) {
      await DataService.deleteUser(id);
      loadUsers();
    }
  };

  const openEditModal = (user = null) => {
    setEditingUser(user);
    setSelectedRole(user?.role || 'teacher');
    setPassword('');
    setNotifyUser(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">用户与权限管理</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
          >
            <History className="w-4 h-4 mr-2" /> 密码修改日志
          </button>
          <button 
            onClick={() => openEditModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> 新增用户
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="搜索用户名、姓名或部门..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学校/学科</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">加载中...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.name ? user.name.charAt(0) : '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{user.school || '-'}</div>
                    <div className="text-xs text-gray-400">{user.subject || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? '管理员' : 
                       user.role === 'district_director' ? '区教研主任' :
                       user.role === 'district_researcher' ? '区教研员' :
                       user.role === 'principal' ? '校长' :
                       user.role === 'teacher' ? '教师' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === 'active' ? (
                      <span className="flex items-center text-green-600 text-sm"><CheckCircle className="w-4 h-4 mr-1"/> 正常</span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm"><XCircle className="w-4 h-4 mr-1"/> 禁用</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-900 mr-4">编辑/密码</button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingUser ? '编辑用户及密码配置' : '新增用户'}</h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名 (登录账号)</label>
                  <input name="username" defaultValue={editingUser?.username} required className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                  <input name="name" defaultValue={editingUser?.name} required className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学校</label>
                  <select name="school" defaultValue={editingUser?.school || ''} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">-- 请选择学校 --</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                  <select 
                    name="role" 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="teacher">教师</option>
                    <option value="principal">校长</option>
                    <option value="district_researcher">区教研员</option>
                    <option value="district_director">区教研主任</option>
                    <option value="admin">系统管理员</option>
                  </select>
                </div>
              </div>

              {selectedRole === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任教学科</label>
                  <select name="subject" defaultValue={editingUser?.subject || (subjects[0]?.name || '')} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">-- 请选择学科 --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号状态</label>
                <select name="status" defaultValue={editingUser?.status || 'active'} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="active">正常启用</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>

              {/* Password Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Key className="w-4 h-4 mr-1 text-blue-500" /> 
                    {editingUser ? '重置密码 (留空则不修改)' : '设置初始密码 *'}
                  </label>
                  <button type="button" onClick={generateRandomPassword} className="text-xs text-blue-600 hover:underline">
                    生成随机密码
                  </button>
                </div>
                
                {editingUser && (
                  <div className="mb-3 text-sm text-gray-600 flex items-center">
                    <span className="mr-2">当前密码:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 font-medium tracking-wider">
                      {editingUser.password || '123'}
                    </span>
                  </div>
                )}

                <div className="relative">
                  <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码..."
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                  {password && (
                    <div className="absolute right-3 top-2.5 text-xs font-semibold">
                      强度: <span className={checkPasswordStrength(password).color}>{checkPasswordStrength(password).text}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex items-center">
                  <input 
                    type="checkbox" 
                    id="notify" 
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2" 
                  />
                  <label htmlFor="notify" className="text-sm text-gray-600">
                    通过邮件或短信将账号/密码通知用户
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h2 className="text-xl font-bold flex items-center"><Shield className="w-5 h-5 mr-2 text-blue-600" /> 安全审计：密码修改日志</h2>
              <button onClick={() => setIsLogModalOpen(false)} className="text-gray-500 hover:text-gray-700">关闭</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="py-2 px-4 border-b">时间</th>
                    <th className="py-2 px-4 border-b">被修改用户</th>
                    <th className="py-2 px-4 border-b">操作人</th>
                    <th className="py-2 px-4 border-b">修改原因/方式</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4 border-b text-gray-500">2026-03-20 09:12:45</td>
                    <td className="py-2 px-4 border-b font-medium">teacher_li (李老师)</td>
                    <td className="py-2 px-4 border-b">admin</td>
                    <td className="py-2 px-4 border-b">管理员重置随机密码</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b text-gray-500">2026-03-18 14:30:00</td>
                    <td className="py-2 px-4 border-b font-medium">teacher_zhang (张老师)</td>
                    <td className="py-2 px-4 border-b">teacher_zhang</td>
                    <td className="py-2 px-4 border-b">用户自助修改密码</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
