import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Edit, Trash2, Filter, User, BookOpen, Calendar, ChevronLeft, ChevronRight, Download, MapPin } from 'lucide-react';
import DataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';

const ObservationList = () => {
  const { user } = useAuth();
  const hideObserverColumn = user?.role === 'teacher';
  const [surveys, setSurveys] = useState([]);
  const [filters, setFilters] = useState({ 
        school: '', 
        subject: 'ALL', 
        timeSpan: 'all', // Default to all time
        surveyType: 'ALL',
        observationType: 'ALL'
    });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    DataService.init().then(() => {
      loadData();
      if (DataService.getSchools) {
        setSchools(DataService.getSchools().map(s => s.name));
      }
      if (DataService.getSubjects) {
        setSubjects(DataService.getSubjects().map(s => s.name));
      }
    });
  }, [filters, user]);

  const loadData = async () => {
    // Inject current user into filters to restrict visibility if needed.
    const mappedFilters = { ...filters, currentUser: user };
    
    if (mappedFilters.subject === 'ALL') {
      delete mappedFilters.subject;
    }
    
    if (mappedFilters.surveyType && mappedFilters.surveyType !== 'ALL') {
      mappedFilters.survey_mode = mappedFilters.surveyType;
    }
    
    if (mappedFilters.observationType && mappedFilters.observationType !== 'ALL') {
      const map = {
        '新授课': 'new',
        '复习课': 'review',
        '习题课': 'exercise',
        '实验课': 'experiment',
        '其它': 'other',
      };
      mappedFilters.lesson_type = map[mappedFilters.observationType] || mappedFilters.observationType;
    }

    // Time Span filter
    if (filters.timeSpan && filters.timeSpan !== 'all') {
      mappedFilters.timeSpan = filters.timeSpan;
    }

    const data = await DataService.getSurveys(mappedFilters);
    setSurveys(data);
  };

  // Using currentItems which is derived from API response directly
    const getFilteredSurveys = () => {
        let result = [...surveys];
        if (filters.school) {
            result = result.filter(obs => obs.school === filters.school);
        }
        return result;
    }
    // Pagination logic for surveys
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = getFilteredSurveys().slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(getFilteredSurveys().length / ITEMS_PER_PAGE); 

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      await DataService.deleteSurvey(id);
      loadData();
    }
  };

  const handleEdit = (id) => {
    navigate(`/observations/edit/${id}`);
  };

  const handleFill = (id) => {
    navigate(`/observations/fill/${id}`);
  };

  const handleFilterChange = (key, value) => {
      setFilters(prev => ({...prev, [key]: value}));
      setCurrentPage(1); // Reset to first page when filters change
    };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
            <h1 className="text-2xl font-bold text-gray-900">听课记录</h1>
            <div className="flex space-x-3">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出列表PDF
                </button>
          <Link
            to="/observations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            新建记录
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center text-gray-700 font-medium">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                <span>筛选条件</span>
            </div>
            
            <div className="flex-1 flex flex-wrap gap-3">
                {/* Survey Type Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <select 
                        className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                        value={filters.surveyType}
                        onChange={(e) => handleFilterChange('surveyType', e.target.value)}
                    >
                        <option value="ALL">全部调研类型</option>
                        <option value="个别调研">个别调研</option>
                        <option value="集中调研">集中调研</option>
                        <option value="集备调研">集备调研</option>
                    </select>
                </div>
                
                {/* Observation Type Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <select 
                        className="block w-full pl-10 pr-10 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                        value={filters.observationType}
                        onChange={(e) => handleFilterChange('observationType', e.target.value)}
                    >
                        <option value="ALL">全部听课类型</option>
                        <option value="new">新授课</option>
                        <option value="review">复习课</option>
                        <option value="exercise">习题课</option>
                        <option value="experiment">实验课</option>
                        <option value="other">其它</option>
                    </select>
                </div>

                {/* School Filter */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
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
                        <option value="week">近一周</option>
                        <option value="month">近一月</option>
                        <option value="three_months">近三月</option>
                        <option value="semester">一学期</option>
                        <option value="year">一学年</option>
                        <option value="three_years">三学年</option>
                    </select>
                </div>
            </div>

            <div className="relative rounded-lg shadow-sm max-w-xs md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-200 rounded-lg py-2 bg-gray-50 hover:bg-white transition-colors"
                    placeholder="搜索教师、课题..."
                />
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                学科
              </th>
              {!hideObserverColumn && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  教研员/听课人
                </th>
              )}
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
              <th scope="col" className="relative px-6 py-3 print:hidden">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((survey) => (
              <tr key={survey.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {survey.subject}
                </td>
                {!hideObserverColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.researcherName ? `${survey.researcherName} (教研员)` : survey.observer}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {survey.school}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {survey.grade}{survey.class}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {survey.teacher}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {survey.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                  <button 
                    onClick={() => handleFill(survey.id)} 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="查看/填写"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  {(hasPermission(user, 'canModifyStructure') || user.role === 'teacher' || user.role === 'district_researcher') && (
                    <button 
                      onClick={() => handleEdit(survey.id)} 
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="编辑"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                  {(hasPermission(user, 'canDelete') || survey.observer === user?.name || survey.researcherName === user?.name) && (
                    <button 
                      onClick={() => handleDelete(survey.id)} 
                      className="text-red-600 hover:text-red-900"
                      title="删除"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-2" />
                    <p>暂无数据</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {surveys.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 print:hidden">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{indexOfFirstItem + 1}</span> 到 <span className="font-medium">{Math.min(indexOfLastItem, surveys.length)}</span> 条，
                  共 <span className="font-medium">{surveys.length}</span> 条
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

export default ObservationList;
