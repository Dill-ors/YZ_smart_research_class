import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Filter, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import DataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import SchoolSelector from '../components/SchoolSelector';
import { hasPermission, isTeacher, ROLES } from '../utils/rbac';

const ScheduleList = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [filters, setFilters] = useState({
        school: '',
        subject: 'ALL',
        timeSpan: 'all',
        status: 'ALL'
    });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const tableScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    DataService.init().then(async () => {
      loadData();
      if (DataService.getSchools) {
        const schoolsData = await DataService.getSchools();
        setSchools(schoolsData);
      }
      if (DataService.getSubjects) {
        const subjectsData = await DataService.getSubjects();
        setSubjects(subjectsData.map(s => s.name));
      }
    });
  }, [filters, user]);

  const loadData = async () => {
    const userSchedules = await DataService.getSchedules(user, true);
    setSchedules(userSchedules);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条日程吗？')) {
      await DataService.deleteSurvey(id, user);
      loadData();
    }
  };

  const handleEdit = (id) => {
    // 根据用户角色决定跳转模式
    // 非教师角色（管理员、区教研主任、校长）只能编辑基本信息
    // 教师角色可以编辑完整听课记录
    const mode = isTeacher(user) ? 'full' : 'basic';
    navigate(`/observations/edit/${id}?from=schedule&mode=${mode}`);
  };

  const handleFill = (id) => {
    navigate(`/observations/fill/${id}?from=schedule`);
  };

  const handleTeacherAction = (id, status) => {
    // 教师总是使用 full 模式
    if (status === 'scheduled' || status === 'expired') {
      // 状态为已安排或已过期，跳转到编辑页面（edit模式）以便教师可以填写
      navigate(`/observations/edit/${id}?from=schedule&mode=full`);
    } else if (status === 'completed') {
      // 状态为已完成，跳转到查看页面（fill模式）
      navigate(`/observations/fill/${id}?from=schedule&mode=full`);
    } else {
      // 未知状态，默认跳转到编辑页面
      console.warn(`Unknown schedule status: ${status}, defaulting to edit mode`);
      navigate(`/observations/edit/${id}?from=schedule&mode=full`);
    }
  };

  const handleView = (id) => {
    navigate(`/observations/fill/${id}?from=schedule`);
  };

  const handleFilterChange = (key, value) => {
      setFilters(prev => ({...prev, [key]: value}));
      setCurrentPage(1);
    };

  // 筛选逻辑
  const getFilteredSchedules = () => {
    let result = [...schedules];
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(s => s.status === filters.status);
    }
    return result;
  };

  // 分页逻辑
  const filteredSchedules = getFilteredSchedules();
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">日程安排</h1>
            <div className="flex space-x-3">
          {(hasPermission(user, 'canManageSchedules') || isTeacher(user)) && (
            <Link
              to={`/observations/new?from=schedule&mode=basic&status=scheduled`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              新建日程
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center text-gray-700 font-medium">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                <span>筛选条件</span>
            </div>

            <div className="flex-1 flex flex-wrap gap-3">
                {/* School Filter */}
                <div className="relative">
                    <SchoolSelector
                        className="w-48"
                        schools={schools}
                        value={filters.school}
                        onChange={(val) => handleFilterChange('school', val)}
                        placeholder="所有学校"
                        icon={<Search className="h-4 w-4 text-gray-400" />}
                    />
                </div>

                {/* Subject Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
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

                {/* Status Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="ALL">全部状态</option>
                        <option value="scheduled">已安排</option>
                        <option value="completed">已完成</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          ref={tableScrollRef}
          className={`overflow-x-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={(e) => {
            setIsDragging(true);
            dragStartX.current = e.pageX - (tableScrollRef.current?.offsetLeft || 0);
            dragScrollLeft.current = tableScrollRef.current?.scrollLeft || 0;
          }}
          onMouseMove={(e) => {
            if (!isDragging || !tableScrollRef.current) return;
            e.preventDefault();
            const x = e.pageX - (tableScrollRef.current.offsetLeft || 0);
            const walk = (x - dragStartX.current) * 1.2;
            tableScrollRef.current.scrollLeft = dragScrollLeft.current - walk;
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                听课人
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                学科
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                学校
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                班级
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                授课教师
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时段
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.observer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {schedule.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.school}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.grade}{schedule.class}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.teacher}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    schedule.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : schedule.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status === 'completed' ? '已完成' : schedule.status === 'expired' ? '已过期' : '已安排'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.period ? schedule.period.replace(/第|节/g, '') : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* 查看按钮 - 所有用户 */}
                  <button
                    onClick={() => handleView(schedule.id)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="查看"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  {/* 修改日程 - 管理用户或自己拥有的日程 */}
                  {(hasPermission(user, 'canManageSchedules') || (isTeacher(user) && (schedule.observer === user?.name || schedule.createdBy === user?.id))) && (
                    <button
                      onClick={() => navigate(`/observations/edit/${schedule.id}?from=schedule&mode=basic`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="修改日程"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}

                  {/* 填写听课记录 - 管理用户或自己作为听课人的日程 */}
                  {(hasPermission(user, 'canManageSchedules') || (isTeacher(user) && schedule.observer === user?.name)) && (
                    <button
                      onClick={() => navigate(`/observations/edit/${schedule.id}?from=schedule&mode=full`)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="填写听课记录"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  )}

                  {/* 删除按钮 - 管理用户或自己拥有的日程 */}
                  {(hasPermission(user, 'canManageSchedules') || (isTeacher(user) && (schedule.observer === user?.name || schedule.createdBy === user?.id))) && (
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-600 hover:text-red-900"
                      title="删除"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                    <p>暂无日程安排</p>
                    <p className="text-sm mt-1">新的日程安排将会在这里显示</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* 分页组件 */}
        {filteredSchedules.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{indexOfFirstItem + 1}</span> 到 <span className="font-medium">{Math.min(indexOfLastItem, filteredSchedules.length)}</span> 条，
                  共 <span className="font-medium">{filteredSchedules.length}</span> 条
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">上一页</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">下一页</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleList;
