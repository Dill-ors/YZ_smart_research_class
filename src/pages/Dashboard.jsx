import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import DataService from '../services/dataService';
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight, Filter, User, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [completionStats, setCompletionStats] = useState(null);
  const [unsubmittedReportsCount, setUnsubmittedReportsCount] = useState(0);
  const [filters, setFilters] = useState({
    school: '',
    subject: '',
    observer: ['district_researcher', 'teacher'].includes(user?.role) ? user.name : '',
    timeSpan: 'all'
  });

  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    DataService.init().then(async () => {
      loadStats();
      if (DataService.getSchools) {
        const schoolsData = await DataService.getSchools();
        setSchools(schoolsData.map(s => s.name));
      }
      if (DataService.getSubjects) {
        const subjectsData = await DataService.getSubjects();
        setSubjects(subjectsData.map(s => s.name));
      }
    });
  }, [filters]);

  const loadStats = async () => {
    const isManager = ['admin', 'district_director', 'principal'].includes(user?.role);
    
    // For dashboard stats, dataService will handle the isManager logic now
    const data = await DataService.getDashboardStats({ ...filters, currentUser: user });
    const compStats = await DataService.getCompletionStats(user);
    
    // For recent surveys, managers should see all recent surveys, teachers/researchers only see their own
    const surveyFilters = isManager ? {} : { currentUser: user };
    const surveys = await DataService.getSurveys(surveyFilters);
    
    // Fetch group survey unsubmitted count for non-managers
    if (!isManager) {
        const reports = await DataService.getReports({ currentUser: user });
        const allResponses = await DataService.getResponses();
        const unsubmittedCount = reports.filter(report => {
            if (report.status !== 'published') return false;
            const hasSubmitted = allResponses.some(r => r.surveyId === report.id && r.userId === user?.username);
            return !hasSubmitted;
        }).length;
        setUnsubmittedReportsCount(unsubmittedCount);
    }
    
    setStats({ ...data, recentSurveys: surveys.slice(0, 5) });
    setCompletionStats(compStats);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Determine if user is a manager (Director or Principal) or Executor (Researcher or Teacher)
  const isManager = ['admin', 'district_director', 'principal'].includes(user?.role);
  
  // Get Target Data for Executors
  const [targetStats, setTargetStats] = useState({ target: 0, completed: 0 });
  
  useEffect(() => {
    const fetchTargets = async () => {
      if (!isManager && user) {
          const targets = await DataService.getTargets();
          const myTarget = targets.find(t => t.userId === user.username);
          
          if (myTarget) {
              const surveys = await DataService.getSurveys({ observer: user.name });
              const completed = surveys.length;
              
              setTargetStats({
                  target: myTarget.targetValue,
                  completed: completed
              });
          }
      }
    };
    fetchTargets();
  }, [user, isManager]);

  if (!stats) return <div className="p-6">加载中...</div>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header & Welcome */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，{user?.name}！这是您的教研工作概览。</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center text-gray-700 font-medium min-w-max">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            <span>筛选视图:</span>
        </div>
        
        <div className="flex-1 flex flex-wrap gap-3">
             {/* Time Span Filter */}
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Calendar className="h-4 w-4 text-gray-400" />
                 </div>
                 <select 
                     className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                     value={filters.timeSpan}
                     onChange={(e) => handleFilterChange('timeSpan', e.target.value)}
                 >
                     <option value="all">全部时间</option>
                     <option value="week">本周</option>
                     <option value="month">本月</option>
                     <option value="semester">本学期</option>
                     <option value="year">本学年</option>
                 </select>
            </div>

            {/* Subject Filter */}
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <BookOpen className="h-4 w-4 text-gray-400" />
                 </div>
                 <select 
                     className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                     value={filters.subject}
                     onChange={(e) => handleFilterChange('subject', e.target.value)}
                 >
                     <option value="ALL">全部科目</option>
                     {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
            </div>

            {/* Observer Filter */}
            {isManager && (
              <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <User className="h-4 w-4 text-gray-400" />
                   </div>
                   <select 
                       className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                       value={filters.observer}
                       onChange={(e) => handleFilterChange('observer', e.target.value)}
                   >
                       <option value="">所有教研员</option>
                       {stats.allObservers?.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>
              </div>
            )}

            {/* School Filter */}
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <CheckCircle className="h-4 w-4 text-gray-400" />
                 </div>
                 <select 
                     className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                     value={filters.school}
                     onChange={(e) => handleFilterChange('school', e.target.value)}
                 >
                     <option value="">所有学校</option>
                     {schools.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '调研学校数', value: stats.schoolCount, unit: '所', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '总体完成率', value: isManager ? (completionStats ? `${completionStats.overallPercentage}%` : '0%') : (targetStats.target > 0 ? `${Math.round((targetStats.completed / targetStats.target) * 100)}%` : '0%'), unit: '', color: 'text-green-600', bg: 'bg-green-50' },
          { label: '调研总次数', value: stats.totalSurveys, unit: '节', color: 'text-purple-600', bg: 'bg-purple-50' },
          isManager 
            ? { label: '未达标人数', value: completionStats ? completionStats.incompleteUsers.length : 0, unit: '人', color: 'text-orange-600', bg: 'bg-orange-50' }
            : { label: '未填写报告数', value: unsubmittedReportsCount, unit: '份', color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className="mt-2 flex items-baseline">
                  <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                  <span className="ml-1 text-sm text-gray-500">{stat.unit}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                {index === 0 && <CheckCircle className={`w-5 h-5 ${stat.color}`} />}
                {index === 1 && <Clock className={`w-5 h-5 ${stat.color}`} />}
                {index === 2 && <Calendar className={`w-5 h-5 ${stat.color}`} />}
                {index === 3 && <AlertCircle className={`w-5 h-5 ${stat.color}`} />}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500 font-medium flex items-center">
                当前统计数据
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Progress & Schedule (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Progress (Ring Chart or Manager Prompt) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">本学期听课进度</h3>
          
          {isManager ? (
            <div className="h-48 flex flex-col justify-center items-center text-center px-4">
              <div className="w-full max-w-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">团队总体完成进度</span>
                  <span className="text-sm font-bold text-blue-600">{completionStats?.overallPercentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionStats?.overallPercentage || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>总目标: {completionStats?.totalTarget || 0}</span>
                  <span>已完成: {completionStats?.totalCompleted || 0}</span>
                </div>
              </div>
              <Link 
                to="/targets" 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                前往目标管理
                <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="h-48 flex flex-col justify-center">
              <div className="relative h-32 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={targetStats.target > 0 
                        ? [{ value: targetStats.completed }, { value: Math.max(0, targetStats.target - targetStats.completed) }] 
                        : [{ value: 0 }, { value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900">
                    {targetStats.target > 0 
                      ? Math.round((targetStats.completed / targetStats.target) * 100) 
                      : 0}%
                  </span>
                  <span className="text-xs text-gray-500 mt-1">已完成</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-6 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">目标节数</p>
                    <p className="text-lg font-bold text-gray-900">{targetStats.target}</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">已听节数</p>
                    <p className="text-lg font-bold text-blue-600">{targetStats.completed}</p>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">近期听课记录</h3>
              <Link to="/observations" className="text-blue-600 text-sm font-medium hover:text-blue-800">全部</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {stats.recentSurveys && stats.recentSurveys.length > 0 ? (
                stats.recentSurveys.map((item, idx) => (
                  <div key={item.id || idx} className="flex group">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                      <div className="w-0.5 h-full bg-gray-100 my-1 group-last:hidden"></div>
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-baseline mb-1">
                        <span className="text-sm font-bold text-gray-900 mr-2">{item.date || '未知日期'}</span>
                        <span className="text-xs text-gray-500">
                          {item.researcherName ? `${item.researcherName} (教研员)` : item.observer}
                        </span>
                      </div>
                      <Link to={`/observations/fill/${item.id}`} className="block bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{item.grade}{item.subject} - {item.teacher}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-600 border border-gray-200">
                            {item.school}
                          </span>
                          {item.lesson_type === 'new' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">新授课</span>}
                          {item.lesson_type === 'review' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">复习课</span>}
                          {item.lesson_type === 'exercise' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">习题课</span>}
                          {item.lesson_type === 'experiment' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">实验课</span>}
                          {item.lesson_type === 'other' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">其它</span>}
                        </div>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  暂无近期听课记录
                </div>
              )}
            </div>
            
            <Link to="/observations/new" className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm text-center block">
              + 新建记录
            </Link>
        </div>
      </div>

      {/* Row 2: Lesson Type & School Coverage (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">课型分布</h3>
          <div className="h-60">
            {stats.lessonTypeData && stats.lessonTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.lessonTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.lessonTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                暂无课型数据
              </div>
            )}
          </div>
        </div>

        {/* School Coverage List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">学校覆盖情况</h3>
            <div className="space-y-4 h-60 overflow-y-auto pr-2 custom-scrollbar">
              {stats.schoolCoverageData && stats.schoolCoverageData.length > 0 ? (
                stats.schoolCoverageData.map((school, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{school.name}</span>
                      <span className="text-gray-500">{school.count}次</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${COLORS[idx % COLORS.length].replace('#', 'bg-[#')} h-2 rounded-full transition-all duration-500`} style={{ width: `${school.percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  暂无学校数据
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Row 3: Subject Distribution & Monthly Trend (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">各学科调研量分布</h3>
          </div>
          <div className="h-72">
            {stats.subjectData && stats.subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} name="调研次数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                暂无学科数据
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend (Area Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">月度调研趋势</h3>
          </div>
          <div className="h-72">
              {stats.monthlyStats && stats.monthlyStats.data && stats.monthlyStats.data.some(v => v > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyStats.data.map((val, idx) => ({ name: stats.monthlyStats.labels[idx], value: val }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    name="调研次数"
                  />
                </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  暂无趋势数据
                </div>
              )}
          </div>
        </div>
      </div>
      
      {/* Recent Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">最近调研记录</h3>
          <Link to="/observations" className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center">
            查看全部 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学科</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学校</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">教师</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">听课人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Use DataService to get a few recent records */}
              {(stats?.recentSurveys || []).map((survey) => (
                <tr 
                  key={survey.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/observations/fill/${survey.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{survey.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{survey.school}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{survey.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{survey.topic}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold mr-2">
                        {(survey.researcherName || survey.observer)?.[0] || 'U'}
                      </div>
                      {survey.researcherName ? `${survey.researcherName} (教研员)` : survey.observer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{survey.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
