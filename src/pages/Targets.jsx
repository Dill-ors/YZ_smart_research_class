import React, { useState, useEffect } from 'react';
import { Target, Save, CheckCircle, AlertCircle, User, Award } from 'lucide-react';
import DataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';

const Targets = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    DataService.init().then(() => {
      loadData();
    });
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const allTargets = await DataService.getTargets();
    setTargets(allTargets);

    // Determine which users the current user can manage
    let users = [];
    if (user?.role === 'district_director' || user?.role === 'admin') {
      // Director manages Researchers
      const researchers = await DataService.getUsersByRole('district_researcher');
      users = [...users, ...researchers];
    } 
    
    if (user?.role === 'principal' || user?.role === 'admin') {
      // Principal manages Teachers (and other school users)
      const teachers = await DataService.getUsersByRole('teacher');
      // Filter teachers by school if principal
      if (user?.role === 'principal') {
          users = [...users, ...teachers.filter(t => t.school === '市北四实验')]; // Mock user school for now
      } else {
          users = [...users, ...teachers];
      }
    }

    setManagedUsers(users);
    setLoading(false);
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    if (!selectedUser || !targetValue) {
        alert('请选择用户并输入目标数值');
        return;
    }

    const targetUser = managedUsers.find(u => u.username === selectedUser);
    
    const newTarget = {
        userId: selectedUser,
        userName: targetUser?.name || selectedUser,
        targetType: 'listen_count', // Default to listen count for now
        targetValue: parseInt(targetValue),
        period: 'semester', // Default to semester
        setterId: user.username,
        setterName: user.name
    };

    await DataService.setTarget(newTarget);
    alert('目标设定成功！');
    setTargetValue('');
    setSelectedUser('');
    loadData(); // Reload to show updated list
  };

  // Helper to get progress (Mocked for now as we don't have easy count per user without filtering surveys)
  const getProgress = (target) => {
      // In a real app, query survey count for this user
      // Mocking random progress for demo
      return Math.floor(Math.random() * target.targetValue);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">目标管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Set Target Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                设定听课目标
            </h2>
            
            <form onSubmit={handleSetTarget} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择对象
                    </label>
                    <select
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">请选择人员...</option>
                        {managedUsers.map(u => (
                            <option key={u.username} value={u.username}>
                                {u.name} ({u.role === 'district_researcher' ? '调研员' : '教师'})
                            </option>
                        ))}
                    </select>
                    {user?.role === 'district_director' && <p className="mt-1 text-xs text-gray-500">可为区调研员设定教研目标</p>}
                    {user?.role === 'principal' && <p className="mt-1 text-xs text-gray-500">可为本校教师设定听课目标</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        目标节数 (本学期)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            min="1"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="例如: 20"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">节</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Save className="h-5 w-5 mr-2" />
                    保存目标
                </button>
            </form>
        </div>

        {/* Targets List & Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
             <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-orange-500" />
                目标监控与进度
            </h2>

            <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                人员
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                目标 (节)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                当前进度
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                状态
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Only show targets for users managed by the current user */}
                        {targets.filter(t => managedUsers.some(u => u.username === t.userId)).map((target) => {
                            const current = getProgress(target);
                            const percent = target.targetValue > 0 ? Math.min(Math.round((current / target.targetValue) * 100), 100) : 0;
                            
                            return (
                                <tr key={target.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{target.userName}</div>
                                                <div className="text-xs text-gray-500">ID: {target.userId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        {target.targetValue}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-xs">
                                            <div 
                                                className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-green-600' : percent >= 50 ? 'bg-blue-600' : 'bg-yellow-500'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            已完成 {current} 节 ({percent}%)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {percent >= 100 ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1 self-center" /> 已达标
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                <AlertCircle className="w-3 h-3 mr-1 self-center" /> 进行中
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {targets.filter(t => managedUsers.some(u => u.username === t.userId)).length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                    暂无目标数据，请先设定目标
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Targets;