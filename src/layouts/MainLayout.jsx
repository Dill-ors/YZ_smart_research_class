import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Target,
  Database
} from 'lucide-react';
import clsx from 'clsx';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: '数据看板', path: '/', icon: LayoutDashboard, roles: ['admin', 'district_director', 'district_researcher', 'principal', 'teacher'] },
    { name: '听课记录', path: '/observations', icon: FileText, roles: ['admin', 'district_director', 'district_researcher', 'principal', 'teacher'] },
    { name: '集中调研', path: '/reports', icon: FileText, roles: ['admin', 'district_director', 'district_researcher', 'principal', 'teacher'] },
    { name: '目标管理', path: '/targets', icon: Target, roles: ['admin', 'district_director', 'principal'] },
    { name: '用户管理', path: '/users', icon: Users, roles: ['admin'] },
    { name: '基础信息', path: '/basic-info', icon: Database, roles: ['admin', 'district_director'] },
    { name: '系统设置', path: '/settings', icon: Settings, roles: ['admin', 'district_director'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'teacher'));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static lg:inset-0 print:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
          <span className="text-xl font-semibold">听评课记录系统</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center px-4 py-3 text-gray-700 rounded-lg transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-gray-900">听评课记录系统</span>
          <div className="w-6" /> {/* Spacer */}
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
