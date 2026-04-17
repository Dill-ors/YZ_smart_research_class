import React, { useState, useEffect, useId } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, Upload, Download, Camera } from 'lucide-react';
import DataService from '../services/dataService';
import { uploadToOSS } from '../services/ossService';
import SchoolSelector from '../components/SchoolSelector';
import { isTeacher, canEditScheduleBasic, ROLES } from '../utils/rbac';

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

const CameraButton = ({ onCaptureSuccess }) => {
  const [capturing, setCapturing] = useState(false);
  const id = useId();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCapturing(true);
    try {
      const result = await uploadToOSS(file);
      onCaptureSuccess(result.url);
    } catch (error) {
      alert(`拍照上传失败: ${error.message}`);
    } finally {
      setCapturing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id={`camera-${id}`}
      />
      <label
        htmlFor={`camera-${id}`}
        className={`cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${capturing ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="拍照上传"
      >
        {capturing ? (
          <span>...</span>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            <span className="ml-1">拍照</span>
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
  const initialStatus = queryParams.get('status') || 'completed';
  const fromSchedule = queryParams.get('from') === 'schedule';
  const scheduleMode = queryParams.get('mode'); // 'basic' | 'full'

  // 获取当前用户
  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState('observation-new');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // 用户加载完成后，确定表单模式
      const isNew = !id;
      let mode;

      if (fromSchedule) {
        // 从日程安排界面进入
        if (isNew) {
          // 新建日程：所有人都只显示课堂基本情况
          mode = 'schedule-basic';
        } else {
          // 编辑日程
          if (scheduleMode === 'basic') {
            mode = 'schedule-basic';
          } else if (scheduleMode === 'full') {
            mode = 'schedule-full';
          } else {
            // 默认根据角色
            mode = isTeacher(user) ? 'schedule-full' : 'schedule-basic';
          }
        }
      } else {
        // 从听课记录入口
        if (isNew) mode = 'observation-new';
        else if (displayMode === 'fill') mode = 'observation-fill';
        else mode = 'observation-edit';
      }

      setFormMode(mode);

      // 新建模式下，教师/教研员自动将听课人固定为自己
      if (!id && isTeacher(user)) {
        setFormData(prev => ({ ...prev, observer: user.name }));
      }
    }
  }, [id, fromSchedule, scheduleMode, displayMode]);

  // 是否是只读模式（仅查看）
  const isReadOnly = formMode === 'observation-fill';
  // 是否只显示基本信息（非教师编辑日程）
  const isBasicOnly = formMode === 'schedule-basic';
  // 是否显示完整表单（教师编辑日程或听课记录）
  const isFullForm = ['schedule-full', 'observation-new', 'observation-edit', 'observation-fill'].includes(formMode);

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
    period: '',
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
    recordMode: 'simple', // 'standard' | 'photo' | 'simple'
    images: [], // array of image urls
    status: initialStatus // 'completed' | 'scheduled'
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
          if (fromSchedule) {
            navigate('/schedules');
          } else {
            navigate('/observations');
          }
        }
      });
    }
  }, [id, navigate, fromSchedule, formMode]);

  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [recordMode, setRecordMode] = useState('simple');
  const [schools, setSchools] = useState([]);
  // 教师列表（用于听课人选择）
  const [teachers, setTeachers] = useState([]);
  // 集中调研模式下评价与总结的自动编号开关
  const [simpleAutoNumber, setSimpleAutoNumber] = useState(false);

  useEffect(() => {
    const loadSchools = async () => {
      if (DataService.getSchools) {
        const schoolsData = await DataService.getSchools();
        setSchools(schoolsData);
      }
    };
    loadSchools();
  }, []);

  // 加载教师列表
  useEffect(() => {
    const loadTeachers = async () => {
      if (DataService.getTeachers) {
        const teachersData = await DataService.getTeachers();
        setTeachers(teachersData);
      }
    };
    loadTeachers();
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
        newData.teacher = '';
      } else if (name === 'grade') {
        newData.class = '';
        newData.subject = '';
      }

      return newData;
    });
  };

  // 处理听课人变化，自动设置学科
  const handleObserverChange = (e) => {
    const observerName = e.target.value;
    const selectedTeacher = teachers.find(t => t.name === observerName);

    setFormData(prev => ({
      ...prev,
      observer: observerName,
      // 如果选择的教师有学科，自动设置学科（但保留用户修改权限）
      subject: selectedTeacher?.subject || prev.subject
    }));
  };

  // 检查评价内容是否完整
  const checkEvaluationComplete = (data, mode) => {
    if (mode === 'simple') {
      // 集中调研模式：检查主要优点和存在问题
      return !!(data.highlights?.trim() && data.problems_suggestions?.trim());
    } else if (mode === 'photo') {
      // 快捷上传模式：检查是否有图片
      return !!(data.images?.length > 0);
    } else if (mode === 'standard') {
      // 标准模式：检查主要评价字段
      const hasProcessSteps = data.processSteps?.length > 0 &&
        data.processSteps.some(step => step.content?.trim());
      const hasTeacherEval = data.teacher_target?.trim() ||
        data.teacher_content?.trim() ||
        data.teacher_method?.trim();
      const hasStudentEval = data.student_participation?.trim() ||
        data.student_thinking?.trim();
      const hasSummary = data.highlights?.trim() || data.overall_evaluation?.trim();

      return hasProcessSteps && hasTeacherEval && hasStudentEval && hasSummary;
    }
    return false;
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

  // 集中调研模式自动编号相关
  const CIRCLE_NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
  const circleNumberRegex = /^[①②③④⑤⑥⑦⑧⑨⑩]+\s*/;

  const applyAutoNumberToText = (text) => {
    if (!text) return text;
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return line;
      const num = CIRCLE_NUMBERS[idx];
      if (!num) return line;
      if (circleNumberRegex.test(line)) {
        return line.replace(circleNumberRegex, num + ' ');
      }
      return `${num} ${line}`;
    }).join('\n');
  };

  const toggleSimpleAutoNumber = () => {
    setSimpleAutoNumber(prev => !prev);
  };

  const handleSimpleTextKeyDown = (field) => (e) => {
    if (!simpleAutoNumber || e.key !== 'Enter' || isReadOnly) return;

    const textarea = e.target;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = value.slice(0, start);
    const afterCursor = value.slice(end);

    const linesBefore = beforeCursor.split('\n');
    const currentLineIndex = linesBefore.length - 1;
    const currentLine = linesBefore[currentLineIndex];

    const allLines = value.split('\n');
    const hasAnyNumber = allLines.some(l => circleNumberRegex.test(l));

    const shouldAutoNumber = circleNumberRegex.test(currentLine) ||
      (!hasAnyNumber && currentLineIndex === 0 && currentLine.trim().length > 0);

    if (!shouldAutoNumber) return;

    e.preventDefault();

    // 确保当前行有编号
    if (!circleNumberRegex.test(currentLine)) {
      linesBefore[currentLineIndex] = `${CIRCLE_NUMBERS[currentLineIndex]} ${currentLine}`;
    } else {
      linesBefore[currentLineIndex] = currentLine.replace(circleNumberRegex, `${CIRCLE_NUMBERS[currentLineIndex]} `);
    }

    const newBeforeCursor = linesBefore.join('\n');
    const newLineNum = CIRCLE_NUMBERS[currentLineIndex + 1];
    const insertText = '\n' + (newLineNum ? newLineNum + ' ' : '');
    const rawValue = newBeforeCursor + insertText + afterCursor;

    // 重新编号后续已有编号的行
    const finalLines = rawValue.split('\n').map((line, idx) => {
      if (idx <= currentLineIndex + 1) return line;
      if (!line.trim()) return line;
      const num = CIRCLE_NUMBERS[idx];
      if (!num) return line;
      if (circleNumberRegex.test(line)) {
        return line.replace(circleNumberRegex, num + ' ');
      }
      return line;
    });

    const finalValue = finalLines.join('\n');
    setFormData(prev => ({ ...prev, [field]: finalValue }));

    const newCursor = newBeforeCursor.length + insertText.length;
    setTimeout(() => {
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
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

    if (!currentUser) {
      alert('用户未登录');
      return;
    }

    const finalData = { ...formData, recordMode };

    // For teachers, auto-set observer to their name
    // 教师填写听课记录时，听课人固定为教师本人
    if (isTeacher(currentUser)) {
      finalData.observer = currentUser.name;
    }

    // 自动状态更新逻辑：
    // 1. 如果是从日程安排界面编辑（schedule-basic 或 schedule-full）
    // 2. 如果是教师填写完整内容（schedule-full 模式）
    // 3. 检查评价内容是否完整
    if (formMode === 'schedule-full' && isTeacher(currentUser)) {
      const isComplete = checkEvaluationComplete(finalData, recordMode);
      if (isComplete) {
        finalData.status = 'completed';
      }
    }

    // If filling a scheduled observation from observation list, mark it as completed
    if (id && finalData.status === 'scheduled' && formMode.startsWith('observation-')) {
      finalData.status = 'completed';
    }

    try {
      if (id) {
        // Update existing record
        await DataService.updateSurvey(id, finalData, currentUser);
      } else {
        // Create new record
        await DataService.addSurvey(finalData, currentUser);
      }

      // Navigate back based on source
      if (fromSchedule) {
        navigate('/schedules');
      } else {
        navigate('/observations');
      }
    } catch (error) {
      alert(`保存失败: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isReadOnly ? '查看听课记录' :
               formMode === 'schedule-basic' ? (id ? '编辑日程安排（基本信息）' : '新建日程安排') :
               formMode === 'schedule-full' ? '编辑日程安排（完整记录）' :
               mode === 'edit' ? '编辑听课记录' : '新建听课记录'}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 print:hidden">
              请填写完整的课堂观察信息。
            </p>
          </div>
          {!isReadOnly && formMode !== 'schedule-basic' && (
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
                  <input type="radio" name="survey_mode" value="集中调研" checked={formData.survey_mode === '集中调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={isReadOnly} />
                  <span className="ml-2 text-gray-700">集中调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="个别调研" checked={formData.survey_mode === '个别调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={isReadOnly} />
                  <span className="ml-2 text-gray-700">个别调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="集备调研" checked={formData.survey_mode === '集备调研'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={isReadOnly} />
                  <span className="ml-2 text-gray-700">集备调研</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="survey_mode" value="其它" checked={formData.survey_mode === '其它'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" disabled={isReadOnly} />
                  <span className="ml-2 text-gray-700">其它</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">学校</label>
              <SchoolSelector
                className="w-full mt-1"
                schools={schools}
                value={formData.school}
                onChange={(val) => handleChange({ target: { name: 'school', value: val } })}
                placeholder="请选择学校"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">年级</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
                disabled={!formData.school || isReadOnly}
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
              disabled={!formData.grade || isReadOnly}
            />
          </div>
            {/* 听课人选择 - 提前到学科之前 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">听课人</label>
              {isTeacher(currentUser) && (formMode.startsWith('observation-') || formMode.startsWith('schedule-')) ? (
                /* 教师填写听课记录时，听课人固定为本人 */
                <input
                  type="text"
                  name="observer"
                  value={currentUser?.name || ''}
                  readOnly
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2 bg-gray-50"
                />
              ) : (
                /* 其他情况使用下拉选择 */
                <select
                  name="observer"
                  value={formData.observer || ''}
                  onChange={handleObserverChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  disabled={isReadOnly}
                >
                  <option value="">请选择听课人</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.subject ? `(${t.subject})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">学科</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
                disabled={isReadOnly}
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
                disabled={isReadOnly}
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
                disabled={isReadOnly}
              />
            </div>
            {/* 时段选择 - 改为第几节课，手动选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">时段</label>
              <select
                name="period"
                value={formData.period || ''}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                disabled={isReadOnly}
              >
                <option value="">请选择时段</option>
                <option value="第1节">第1节</option>
                <option value="第2节">第2节</option>
                <option value="第3节">第3节</option>
                <option value="第4节">第4节</option>
                <option value="第5节">第5节</option>
                <option value="第6节">第6节</option>
                <option value="第7节">第7节</option>
                <option value="第8节">第8节</option>
              </select>
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
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">课型</label>
              <select
                name="lesson_type"
                value={formData.lesson_type}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                disabled={isReadOnly}
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

        {/* Quick Photo Mode View - 在 schedule-basic 模式下不显示 */}
        {recordMode === 'photo' && formMode !== 'schedule-basic' && (
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
                  disabled={isReadOnly}
                />
            </div>
          </section>
        )}

        {/* Simple Mode View */}
        {recordMode === 'simple' && formMode !== 'schedule-basic' && (
          <>
            <section>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900 border-l-4 border-blue-500 pl-2">2. 评价与总结</h4>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={toggleSimpleAutoNumber}
                    className={`text-xs px-2 py-1 rounded border ${simpleAutoNumber ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {simpleAutoNumber ? '关闭自动编号' : '自动编号'}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">（1）主要优点：</label>
                    {!isReadOnly && (
                      <div className="flex gap-2">
                        <UploadButton onUploadSuccess={handleUploadSuccess('highlights')} />
                        <CameraButton onCaptureSuccess={handleUploadSuccess('highlights')} />
                      </div>
                    )}
                  </div>
                  <textarea
                    name="highlights"
                    rows={4}
                    value={formData.highlights}
                    onChange={handleChange}
                    onKeyDown={handleSimpleTextKeyDown('highlights')}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">（2）存在问题：</label>
                    {!isReadOnly && (
                      <div className="flex gap-2">
                        <UploadButton onUploadSuccess={handleUploadSuccess('problems_suggestions')} />
                        <CameraButton onCaptureSuccess={handleUploadSuccess('problems_suggestions')} />
                      </div>
                    )}
                  </div>
                  <textarea
                    name="problems_suggestions"
                    rows={4}
                    value={formData.problems_suggestions}
                    onChange={handleChange}
                    onKeyDown={handleSimpleTextKeyDown('problems_suggestions')}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">3. 给学校的意见建议</h4>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">给学校的意见建议：</label>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <UploadButton onUploadSuccess={handleUploadSuccess('school_suggestions')} />
                      <CameraButton onCaptureSuccess={handleUploadSuccess('school_suggestions')} />
                    </div>
                  )}
                </div>
                <textarea
                  name="school_suggestions"
                  rows={4}
                  value={formData.school_suggestions}
                  onChange={handleChange}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                  disabled={isReadOnly}
                />
              </div>
            </section>
          </>
        )}

        {/* Standard Mode View - 在 schedule-basic 模式下不显示 */}
        {recordMode === 'standard' && formMode !== 'schedule-basic' && (
          <>
            {/* 2. Teaching Process */}
            <section>
          <div className="flex justify-between items-center mb-4 border-l-4 border-blue-500 pl-2">
            <h4 className="text-md font-medium text-gray-900">2. 教学过程实录与观察</h4>
            {!isReadOnly && formMode !== 'schedule-basic' && (
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                  />
                </div>

                <div className="flex-1">
                  <textarea
                    rows={3}
                    placeholder="环节内容描述与观察..."
                    value={step.content}
                    onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2 h-full"
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="flex flex-col gap-2 pt-0">
                  {!isReadOnly && formMode !== 'schedule-basic' && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700 p-1.5 border border-transparent hover:bg-red-50 rounded text-center"
                      title="删除环节"
                    >
                      <Trash2 className="h-5 w-5 mx-auto" />
                    </button>
                  )}
                  {!isReadOnly && formMode !== 'schedule-basic' && <UploadButton onUploadSuccess={handleUploadSuccess(`processSteps[${index}].content`)} />}
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
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">B. 学生学习状态观察</h5>
                  {!isReadOnly && formMode !== 'schedule-basic' && (
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
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Evaluation - 在 schedule-basic 模式下不显示 */}
        {formMode !== 'schedule-basic' && (
          <section>
            <h4 className="text-md font-medium text-gray-900 mb-4 border-l-4 border-blue-500 pl-2">4. 评价与总结</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">课堂特色与亮点</label>
                  {!isReadOnly && (
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
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">问题与改进建议</label>
                  {!isReadOnly && (
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
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">总体评价</label>
                  {!isReadOnly && (
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
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </section>
        )}
          </>
        )}

          <div className="pt-5 border-t border-gray-200 print:hidden">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(fromSchedule ? '/schedules' : '/observations')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isReadOnly || formMode === 'schedule-basic' ? '返回' : '取消'}
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
              {!isReadOnly && recordMode !== 'custom' && (
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {formMode === 'schedule-basic' ? '保存日程' : '保存记录'}
                </button>
              )}
            </div>
          </div>
      </form>
    </div>
  );
};

export default ObservationForm;
