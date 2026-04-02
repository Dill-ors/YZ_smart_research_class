import React, { useState, useEffect, useId } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, Upload, Download } from 'lucide-react';
import DataService from '../services/dataService';
import { uploadToOSS } from '../services/ossService';
import SurveyEngine from '../components/SurveyEngine';

const UploadButton = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const id = useId();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadToOSS(file);
      // 移除模拟的 OCR 识别，直接返回图片链接
      onUploadSuccess(result.url);
    } catch (error) {
      alert(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="relative inline-block">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={id}
      />
      <label
        htmlFor={id}
        className={`cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="上传图片"
      >
        {uploading ? (
          <span>...</span>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span className="ml-1">上传</span>
          </>
        )}
      </label>
    </div>
  );
};

const ObservationForm = ({ mode = 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isBoardMode = queryParams.get('mode') === 'board';
  const displayMode = isBoardMode ? 'board' : mode;
  const [formData, setFormData] = useState({
    school: '',
    grade: '',
    class: '',
    subject: '',
    teacher: '',
    date: new Date().toISOString().split('T')[0],
    survey_mode: '集中调研', // Default to group survey
    topic: '',
    lesson_type: 'new',
    period: '1',
    processSteps: [{ step: '1', type: '情景导入', time: '', content: '' }],
    teacher_target: '',
    teacher_content: '',
    teacher_method: '',
    teacher_org: '',
    teacher_literacy: '',
    student_participation: '',
    student_thinking: '',
    student_achievement: '',
    highlights: '',
    problems_suggestions: '',
    school_suggestions: '',
    overall_evaluation: '',
    recordMode: 'simple', // 'standard' | 'photo' | 'custom' | 'simple'
    images: [], // array of image urls
    customSurveyData: null // for custom mode
  });

  useEffect(() => {
    if (id) {
      DataService.init().then(async () => {
        const survey = await DataService.getSurveyById(id);
        if (survey) {
          setFormData(prev => ({ ...prev, ...survey }));
          if (survey.recordMode) {
              setRecordMode(survey.recordMode);
          }
        } else {
          alert('记录不存在');
          navigate('/observations');
        }
      });
    }
  }, [id, navigate]);

  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  const [recordMode, setRecordMode] = useState('simple');
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    const loadSchools = async () => {
      if (DataService.getSchools) {
        const schoolsData = await DataService.getSchools();
        setSchools(schoolsData.map(s => s.name));
      }
    };
    loadSchools();
  }, []);

  // Set available subjects and grades based on selected school
  useEffect(() => {
    const loadSubjects = async () => {
      if (formData.school) {
        setAvailableGrades(['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三']);
        if (DataService.getSubjects) {
          const subjectsData = await DataService.getSubjects();
          setAvailableSubjects(subjectsData.map(s => s.name));
        } else {
          setAvailableSubjects([]);
        }
      } else {
        setAvailableGrades([]);
        setAvailableSubjects([]);
      }
    };
    loadSubjects();
  }, [formData.school]);

  // Handle Cascading Resets
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Handle Cascading Resets
      if (name === 'school') {
        newData.grade = '';
        newData.class = '';
        newData.subject = '';
        // Teacher is now manual, so we don't strictly need to reset it, 
        // but it might be good practice to reset if the school changes.
        // However, if it's a manual text input, maybe we just leave it or clear it.
        // Let's clear it to be safe.
        newData.teacher = '';
      } else if (name === 'grade') {
        newData.class = '';
        newData.subject = ''; 
      } 
      // Class and Subject changes no longer affect teacher (no auto-match)
      
      return newData;
    });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.processSteps];
    newSteps[index][field] = value;
    setFormData(prev => ({ ...prev, processSteps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      processSteps: [...prev.processSteps, { step: (prev.processSteps.length + 1).toString(), type: '新知探究', time: '', content: '' }]
    }));
  };

  const removeStep = (index) => {
    if (formData.processSteps.length > 1) {
      const newSteps = formData.processSteps.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, processSteps: newSteps }));
    }
  };

  const handleUploadSuccess = (field) => (url) => {
    if (field === 'images') {
        setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), url]
        }));
        return;
    }
    
    const appendText = `[图片: ${url}]`;

    // Check if field is a path for processSteps array
    if (field.startsWith('processSteps[')) {
        const matches = field.match(/processSteps\[(\d+)\]\.(\w+)/);
        if (matches) {
            const index = parseInt(matches[1]);
            const key = matches[2];
            // Directly update the state for nested property
            setFormData(prev => {
                const newSteps = [...prev.processSteps];
                newSteps[index] = {
                    ...newSteps[index],
                    [key]: (newSteps[index][key] ? newSteps[index][key] + '\n' : '') + appendText
                };
                return { ...prev, processSteps: newSteps };
            });
        }
        return;
    }
    
    if (field === 'teacher_observation_all') {
         // Append to teacher_target as a default place for general observation text if no specific field targeted
         setFormData(prev => ({
            ...prev,
            teacher_target: (prev.teacher_target ? prev.teacher_target + '\n' : '') + appendText
        }));
        return;
    }

    if (field === 'student_observation_all') {
         // Append to student_participation as a default
         setFormData(prev => ({
            ...prev,
            student_participation: (prev.student_participation ? prev.student_participation + '\n' : '') + appendText
        }));
        return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] ? prev[field] + '\n' : '') + appendText
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Automatically set the observer to the current user's name if they are a teacher or researcher
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const finalData = { ...formData, recordMode };
    
    if (user && (user.role === 'teacher' || user.role === 'district_researcher')) {
        finalData.observer = user.name;
        // Milestone 7: 记录教研员信息
        if (user.role === 'district_researcher') {
            finalData.researcherName = user.name;
        }
    }

    if (recordMode === 'custom') {
        // Handle custom mode submit via SurveyEngine callback, not here
        return;
    }

    await DataService.addSurvey(finalData);
    navigate('/observations');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {mode === 'fill' ? '查看听课记录' : mode === 'edit' ? '编辑听课记录' : '新建听课记录'}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 print:hidden">
              请填写完整的课堂观察信息。
            </p>
          </div>
          {mode !== 'fill' && (
            <div className="flex bg-gray-100 p-1 rounded-lg print:hidden">
              <button
                type="button"
                onClick={() => {
                  setRecordMode('simple');
                  setFormData(prev => ({ ...prev, recordMode: 'simple' }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${recordMode === 'simple' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                集中调研模式
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecordMode('photo');
                  setFormData(prev => ({ ...prev, recordMode: 'photo' }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${recordMode === 'photo' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                快捷上传模式
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecordMode('standard');
                  setFormData(prev => ({ ...prev, recordMode: 'standard' }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${recordMode === 'standard' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                标准模式
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecordMode('custom');
                  setFormData(prev => ({ ...prev, recordMode: 'custom' }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${recordMode === 'custom' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                自定义模式
              </button> 
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-8">
        {/* 1. Basic Info */}
        <section>
          <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">1. 课堂基本情况</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">调研方式</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="集中调研" checked={formData.survey_mode === '集中调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={mode === 'fill'} />
                  <span className="ml-2 text-gray-700">集中调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="个别调研" checked={formData.survey_mode === '个别调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={mode === 'fill'} />
                  <span className="ml-2 text-gray-700">个别调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="集备调研" checked={formData.survey_mode === '集备调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={mode === 'fill'} />
                  <span className="ml-2 text-gray-700">集备调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="其它" checked={formData.survey_mode === '其它'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={mode === 'fill'} />
                  <span className="ml-2 text-gray-700">其它</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">学校</label>
              <select
                name="school"
                value={formData.school}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
                disabled={mode === 'fill'}
              >
                <option value="">请选择学校</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">年级</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
                disabled={!formData.school || mode === 'fill'}
              >
                <option value="">请选择年级</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">班级</label>
            <input
              type="text"
              name="class"
              value={formData.class}
              onChange={handleChange}
              placeholder="请输入班级(如: 1班)"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
              required
              disabled={!formData.grade || mode === 'fill'}
            />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">学科</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
                disabled={!formData.class || mode === 'fill'}
              >
                <option value="">请选择学科</option>
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">授课教师</label>
              <input
                type="text"
                name="teacher"
                value={formData.teacher}
                onChange={handleChange}
                placeholder="请输入教师姓名"
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                required
                disabled={!formData.subject || mode === 'fill'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">调研时间</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                required
                disabled={mode === 'fill'}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">课题名称</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                required
                disabled={mode === 'fill'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">课型</label>
              <select
                name="lesson_type"
                value={formData.lesson_type}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                disabled={mode === 'fill'}
              >
                <option value="new">新授课</option>
                <option value="review">复习课</option>
                <option value="exercise">习题课</option>
                <option value="experiment">实验课</option>
                <option value="other">其它</option>
              </select>
            </div>
          </div>
        </section>

        {/* Quick Photo Mode View */}
        {recordMode === 'photo' && (
          <section className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">快捷上传记录</h3>
              <p className="mt-1 text-sm text-gray-500">
                如果时间紧张，可以直接上传听课笔记图片，系统将自动保存。<br/>
                建议上传清晰的照片。
              </p>
              {(!formData.images || formData.images.length < 9) && (
                <div className="mt-6 flex justify-center gap-2">
                  <UploadButton onUploadSuccess={handleUploadSuccess('images')} />
                </div>
              )}
            </div>

            {formData.images && formData.images.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900 mb-4">已上传图片 ({formData.images?.length || 0})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`记录图 ${idx + 1}`} className="h-32 w-full object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">补充说明 (可选)</label>
                <textarea
                  name="overall_evaluation"
                  rows={4}
                  value={formData.overall_evaluation}
                  onChange={handleChange}
                  placeholder="可在此添加对图片的文字补充说明..."
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={mode === 'fill'}
                />
            </div>
          </section>
        )}

        {/* Custom Mode View */}
        {recordMode === 'custom' && (
          <section className="bg-white rounded-lg">
             <SurveyEngine 
                initialData={{ ...(formData.customSurveyData || { title: '自定义听课记录', questions: [] }), customAnswers: formData.customAnswers }} 
                mode={displayMode === 'board' ? 'view' : (mode === 'fill' ? 'view' : 'create')}
                disablePermissions={true}
                onSave={(surveyData) => {
                    setFormData(prev => ({ ...prev, customSurveyData: surveyData }));
                }} 
                onSubmit={async (answers) => {
                    // For custom mode fill
                    const finalData = { ...formData, recordMode, customSurveyData: formData.customSurveyData, customAnswers: answers };
                    const userStr = localStorage.getItem('currentUser');
                    const user = userStr ? JSON.parse(userStr) : null;
                    if (user && (user.role === 'teacher' || user.role === 'district_researcher')) {
                        finalData.observer = user.name;
                        if (user.role === 'district_researcher') {
                            finalData.researcherName = user.name;
                        }
                    }
                    await DataService.addSurvey(finalData);
                    navigate('/observations');
                }}
                onCancel={() => navigate('/observations')} 
              />
          </section>
        )}

        {/* Simple Mode View */}
        {recordMode === 'simple' && (
          <>
            <section>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">2. 评价与总结</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">（1）主要优点：</label>
                    {mode !== 'fill' && (
                      <div className="flex gap-2">
                        <UploadButton onUploadSuccess={handleUploadSuccess('highlights')} />
                      </div>
                    )}
                  </div>
                  <textarea
                    name="highlights"
                    rows={4}
                    value={formData.highlights}
                    onChange={handleChange}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={mode === 'fill'}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">（2）存在问题：</label>
                    {mode !== 'fill' && (
                      <div className="flex gap-2">
                        <UploadButton onUploadSuccess={handleUploadSuccess('problems_suggestions')} />
                      </div>
                    )}
                  </div>
                  <textarea
                    name="problems_suggestions"
                    rows={4}
                    value={formData.problems_suggestions}
                    onChange={handleChange}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={mode === 'fill'}
                  />
                </div>
              </div>
            </section>
            
            <section>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">3. 给学校的意见建议</h4>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">给学校的意见建议：</label>
                  {mode !== 'fill' && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('school_suggestions')} />
                    </div>
                  )}
                </div>
                <textarea
                  name="school_suggestions"
                  rows={4}
                  value={formData.school_suggestions}
                  onChange={handleChange}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={mode === 'fill'}
                />
              </div>
            </section>
          </>
        )}

        {/* Standard Mode View */}
        {recordMode === 'standard' && (
          <>
            {/* 2. Teaching Process */}
            <section>
          <div className="flex justify-between items-center mb-4 border-l-4 border-blue-500 pl-2">
            <h4 className="text-md font-medium text-gray-900">2. 教学过程实录与观察</h4>
            {mode !== 'fill' && (
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                添加环节
              </button>
            )}
          </div>
          <div className="space-y-4">
            {formData.processSteps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-md">
                {/* Removed index number */}
                
                <div className="w-32 flex flex-col gap-2">
                   <select
                    value={step.type}
                    onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={mode === 'fill'}
                  >
                    <option value="情景导入">情景导入</option>
                    <option value="新知探究">新知探究</option>
                    <option value="巩固练习">巩固练习</option>
                    <option value="总结归纳">总结归纳</option>
                    <option value="布置作业">布置作业</option>
                  </select>
                  <input
                    type="number"
                    placeholder="时长(分)"
                    value={step.time}
                    onChange={(e) => handleStepChange(index, 'time', e.target.value)}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={mode === 'fill'}
                  />
                </div>

                <div className="flex-1">
                  <textarea
                    rows={3}
                    placeholder="环节内容描述与观察..."
                    value={step.content}
                    onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2 h-full"
                    disabled={mode === 'fill'}
                  />
                </div>
                
                <div className="flex flex-col gap-2 pt-0">
                  {mode !== 'fill' && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700 p-1.5 border border-transparent hover:bg-red-50 rounded text-center"
                      title="删除环节"
                    >
                      <Trash2 className="h-5 w-5 mx-auto" />
                    </button>
                  )}
                  {mode !== 'fill' && <UploadButton onUploadSuccess={handleUploadSuccess(`processSteps[${index}].content`)} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Observation Indicators */}
        <section>
          <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">3. 观察指标</h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-900">A. 教师教学行为观察</h5>
                <div className="flex gap-2">
                  <UploadButton onUploadSuccess={handleUploadSuccess('teacher_observation_all')} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[
                    { key: 'teacher_target', label: '教学目标 (明确/具体/落实)' },
                    { key: 'teacher_content', label: '教学内容 (科学/重难点/教材加工)' },
                    { key: 'teacher_method', label: '教学方法 (启发/互动/多媒体)' },
                    { key: 'teacher_org', label: '教学组织 (氛围/调控)' },
                    { key: 'teacher_literacy', label: '教师素养 (语言/教态/板书/评价)' }
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {item.label}
                      </label>
                      <textarea
                        name={item.key}
                        rows={2}
                        value={formData[item.key]}
                        onChange={handleChange}
                        className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                        disabled={mode === 'fill'}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">B. 学生学习状态观察</h5>
                  {mode !== 'fill' && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('student_observation_all')} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: 'student_participation', label: '参与度' },
                    { key: 'student_thinking', label: '思维状态' },
                    { key: 'student_achievement', label: '目标达成' }
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {item.label}
                      </label>
                      <textarea
                        name={item.key}
                        rows={2}
                        value={formData[item.key]}
                        onChange={handleChange}
                        className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                        disabled={mode === 'fill'}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Evaluation */}
          <section>
            <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">4. 评价与总结</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">课堂特色与亮点</label>
                  {mode !== 'fill' && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('highlights')} />
                    </div>
                  )}
                </div>
                <textarea
                  name="highlights"
                  rows={4}
                  value={formData.highlights}
                  onChange={handleChange}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={mode === 'fill'}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">问题与改进建议</label>
                  {mode !== 'fill' && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('problems_suggestions')} />
                    </div>
                  )}
                </div>
                <textarea
                  name="problems_suggestions"
                  rows={4}
                  value={formData.problems_suggestions}
                  onChange={handleChange}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={mode === 'fill'}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">总体评价</label>
                  {mode !== 'fill' && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('overall_evaluation')} />
                    </div>
                  )}
                </div>
                <textarea
                  name="overall_evaluation"
                  rows={4}
                  value={formData.overall_evaluation}
                  onChange={handleChange}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={mode === 'fill'}
                />
              </div>
            </div>
          </section>
          </>
        )}

          <div className="pt-5 border-t border-gray-200 print:hidden">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/observations')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'fill' ? '返回' : '取消'}
              </button>
              {mode === 'fill' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-5 w-5 mr-2" />
                  导出PDF
                </button>
              )}
              {mode !== 'fill' && recordMode !== 'custom' && (
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-5 w-5 mr-2" />
                  保存记录
                </button>
              )}
            </div>
          </div>
      </form>
    </div>
  );
};

export default ObservationForm;
