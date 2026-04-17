import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Edit, Trash2, Filter, User, BookOpen, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import DataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import SchoolSelector from '../components/SchoolSelector';
import { hasPermission, canDeleteSchedule } from '../utils/rbac';

const ObservationList = () => {
  const { user } = useAuth();
  const hideObserverColumn = user?.role === 'teacher';
  const [surveys, setSurveys] = useState([]);
  const [filters, setFilters] = useState({ 
        school: '', 
        subject: 'ALL', 
        surveyType: 'ALL',
        observationType: 'ALL',
        filterTimeType: 'single',
        filterTime: '',
        filterTimeEnd: ''
    });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

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
    if (filters.filterTime || filters.filterTimeEnd) {
      mappedFilters.filterTimeType = filters.filterTimeType;
      mappedFilters.filterTime = filters.filterTime;
      mappedFilters.filterTimeEnd = filters.filterTimeEnd;
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
      await DataService.deleteSurvey(id, user);
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

  const filteredSurveys = getFilteredSurveys();

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSurveys.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const exportToWord = () => {
    const selectedSurveys = filteredSurveys.filter(s => selectedIds.includes(s.id));
    if (selectedSurveys.length === 0) {
      alert('请先选择要导出的记录');
      return;
    }

    const lessonTypeMap = {
      new: '新授课',
      review: '复习课',
      exercise: '习题课',
      experiment: '实验课',
      other: '其它'
    };

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
        xmlns:w='urn:schemas-microsoft-com:office:word'
        xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>听课记录导出</title></head>
      <body>
      <div style="font-family: SimSun, 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; padding: 20px;">
        <h1 style="text-align: center; font-size: 20pt; font-weight: bold; margin-bottom: 30px;">听课记录汇总</h1>
    `;

    selectedSurveys.forEach((survey, idx) => {
      html += `<div style="margin-bottom: 40px; page-break-after: always;">`;
      html += `<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">记录 ${idx + 1}: ${survey.subject || ''} - ${survey.teacher || ''}</h2>`;
      html += `<table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">`;
      html += `
        <tr><td style="background-color: #f3f4f6; width: 20%;"><strong>学科</strong></td><td>${survey.subject || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>听课人</strong></td><td>${survey.researcherName ? `${survey.researcherName} (教研员)` : survey.observer || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>学校</strong></td><td>${survey.school || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>班级</strong></td><td>${survey.grade || ''}${survey.class || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>授课教师</strong></td><td>${survey.teacher || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>时间</strong></td><td>${survey.date || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>调研方式</strong></td><td>${survey.survey_mode || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>课题</strong></td><td>${survey.topic || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>课型</strong></td><td>${lessonTypeMap[survey.lesson_type] || survey.lesson_type || ''}</td></tr>
        <tr><td style="background-color: #f3f4f6;"><strong>时段</strong></td><td>${survey.period || ''}</td></tr>
      `;
      html += `</table>`;

      if (survey.processSteps && survey.processSteps.length > 0) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">教学过程实录</h3>`;
        survey.processSteps.forEach((step, sIdx) => {
          html += `<div style="margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #3B82F6;">`;
          html += `<p><strong>环节 ${sIdx + 1}:</strong> ${step.type || ''} ${step.time ? `(${step.time}分钟)` : ''}</p>`;
          html += `<p>${(step.content || '').replace(/\n/g, '<br/>')}</p>`;
          html += `</div>`;
        });
      }

      const teacherFields = [
        { label: '教学目标', value: survey.teacher_target },
        { label: '教学内容', value: survey.teacher_content },
        { label: '教学方法', value: survey.teacher_method },
        { label: '教学组织', value: survey.teacher_org },
        { label: '教师素养', value: survey.teacher_literacy }
      ].filter(f => f.value);

      if (teacherFields.length > 0) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">教师教学行为观察</h3>`;
        teacherFields.forEach(f => {
          html += `<p style="margin-bottom: 8px;"><strong>${f.label}:</strong><br/>${f.value.replace(/\n/g, '<br/>')}</p>`;
        });
      }

      const studentFields = [
        { label: '参与度', value: survey.student_participation },
        { label: '思维状态', value: survey.student_thinking },
        { label: '目标达成', value: survey.student_achievement }
      ].filter(f => f.value);

      if (studentFields.length > 0) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">学生学习状态观察</h3>`;
        studentFields.forEach(f => {
          html += `<p style="margin-bottom: 8px;"><strong>${f.label}:</strong><br/>${f.value.replace(/\n/g, '<br/>')}</p>`;
        });
      }

      if (survey.highlights) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">主要优点 / 课堂特色与亮点</h3>`;
        html += `<p style="margin-bottom: 8px;">${survey.highlights.replace(/\n/g, '<br/>')}</p>`;
      }
      if (survey.problems_suggestions) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">存在问题 / 问题与改进建议</h3>`;
        html += `<p style="margin-bottom: 8px;">${survey.problems_suggestions.replace(/\n/g, '<br/>')}</p>`;
      }
      if (survey.school_suggestions) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">给学校的意见建议</h3>`;
        html += `<p style="margin-bottom: 8px;">${survey.school_suggestions.replace(/\n/g, '<br/>')}</p>`;
      }
      if (survey.overall_evaluation) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">总体评价 / 补充说明</h3>`;
        html += `<p style="margin-bottom: 8px;">${survey.overall_evaluation.replace(/\n/g, '<br/>')}</p>`;
      }

      if (survey.images && survey.images.length > 0) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; margin: 15px 0 10px;">上传图片</h3>`;
        html += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
        survey.images.forEach(url => {
          html += `<img src="${url}" style="max-width: 200px; max-height: 200px; border: 1px solid #ccc;" />`;
        });
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `</div></body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `听课记录导出_${new Date().toLocaleDateString('zh-CN')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
            <h1 className="text-2xl font-bold text-gray-900">听课记录</h1>
            <div className="flex space-x-3">
                <button
                  onClick={exportToWord}
                  disabled={selectedIds.length === 0}
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedIds.length === 0 ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出Word {selectedIds.length > 0 && `(${selectedIds.length})`}
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
                    <SchoolSelector
                        className="w-48"
                        schools={schools}
                        value={filters.school}
                        onChange={(val) => handleFilterChange('school', val)}
                        placeholder="所有学校"
                        icon={<User className="h-4 w-4 text-gray-400" />}
                    />
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

                {/* Time Filter */}
                <div className="flex items-center flex-wrap gap-2">
                    <select 
                        value={filters.filterTimeType}
                        onChange={(e) => {
                          handleFilterChange('filterTimeType', e.target.value);
                          if (e.target.value === 'single') handleFilterChange('filterTimeEnd', '');
                        }}
                        className="block w-32 py-2 px-3 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                    >
                        <option value="single">具体某一天</option>
                        <option value="range">时间段</option>
                    </select>
                    
                    <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="date" 
                            value={filters.filterTime} 
                            onChange={(e) => handleFilterChange('filterTime', e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                        />
                    </div>
                    
                    {filters.filterTimeType === 'range' && (
                        <>
                            <span className="text-gray-500 text-sm">至</span>
                            <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <input 
                                    type="date" 
                                    value={filters.filterTimeEnd} 
                                    onChange={(e) => handleFilterChange('filterTimeEnd', e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                                />
                            </div>
                        </>
                    )}
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
              <th scope="col" className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredSurveys.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
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
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(survey.id)}
                    onChange={() => handleSelectOne(survey.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
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
                  {/* 删除按钮 - 管理员/主任/校长有全局删除权限，教师/区教研员只能删除自己的记录 */}
                  {(hasPermission(user, 'canDelete') || ((user?.role === 'teacher' || user?.role === 'district_researcher') && survey.observer === user?.name)) && (
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
                <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
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
