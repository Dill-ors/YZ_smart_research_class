import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Lock, ChevronDown } from 'lucide-react';

const ROLES = [
  { id: 'admin', name: '管理员' },
  { id: 'district_director', name: '区主任' },
  { id: 'district_researcher', name: '区调研员' },
  { id: 'principal', name: '校长' },
  { id: 'teacher', name: '教师' }
];

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('admin');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login logic based on legacy app
    const userData = {
      username,
      name: username === 'admin' ? '管理员' : '测试用户',
      role,
      school: role === 'principal' || role === 'teacher' ? '市北四实验' : '区教研室'
    };
    login(userData);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            教研室调研管理系统
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请登录您的账号
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none rounded-t-md relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                id="role"
                name="role"
                className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
