import React, { useState, useEffect, useMemo } from 'react';
import { Save, Eye, ArrowLeft, Download, BarChart2, RefreshCw, Menu, ListTree, Settings2 } from 'lucide-react';

// Convert number to Chinese number
const toChineseNumber = (num) => {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) {
    return chineseNumbers[num - 1] || num.toString();
  } else if (num <= 99) {
    const tens = Math.floor(num / 10);
    const units = num % 10;
    if (units === 0) {
      return `${chineseNumbers[tens - 1]}十`;
    } else if (tens === 1) {
      return `十${chineseNumbers[units - 1]}`;
    } else {
      return `${chineseNumbers[tens - 1]}十${chineseNumbers[units - 1]}`;
    }
  }
  return num.toString();
};
import { QUESTION_TYPES } from './QuestionTypes';
import QuestionRenderer from './QuestionRenderer';
import PropertyPanel from './PropertyPanel';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/rbac';
import DataService from '../../services/dataService';
import { exportReport } from '../../utils/exportReport';

export default function SurveyEngine({ initialData, onSave, onSubmit, onCancel, onRefresh, mode = 'edit', responses = [] }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'fill' || mode === 'board' ? 'preview' : 'edit'); // edit, preview, analysis
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [selectedId, setSelectedId] = useState(null);
  
  // Get latest responses per user
  const latestResponses = Object.values([...responses].sort((a, b) => a.id - b.id).reduce((acc, r) => {
    acc[r.userId] = r;
    return acc;
  }, {}));

  // Basic state to store answers (mock or real)
  const [answers, setAnswers] = useState(() => {
    if (mode === 'board' || mode === 'fill') {
      const myRes = latestResponses.find(r => r.userId === user?.username);
      return myRes ? myRes.answers : {};
    }
    return {};
  });

  useEffect(() => {
    if (mode === 'fill' || mode === 'board') {
      setActiveTab('preview');
    }
  }, [mode]);

  // Global settings
  const [title, setTitle] = useState(initialData?.title || '未命名调研问卷');
  const [description] = useState(initialData?.description || '');

  // Panel toggle states
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  
  // Auto numbering state
  const [autoNumbering, setAutoNumbering] = useState(true);
  
  // Extract outline from questions with auto numbering
  const { outline, questionNumbers } = useMemo(() => {
    const numbering = { h2: 0, h3: 0, h4: 0 };
    const questionNumbers = {};

    const outline = questions.map((q, index) => {
      let level = 3; // Default to lowest level
      let titleText = q.label || '未命名题目';
      let numberedTitle = titleText;
      let displayNumber = ''; // 用于在标题行显示的编号

      if (q.type === 'title' && autoNumbering) {
        switch (q.level) {
          case 'h1':
            level = 0; // H1 是主标题，级别最高
            numberedTitle = titleText; // H1不编号
            displayNumber = '';
            break;
          case 'h2':
            level = 1;
            numbering.h2++;
            numbering.h3 = 0; // Reset H3 counter
            numbering.h4 = 0; // Reset H4 counter
            displayNumber = `${toChineseNumber(numbering.h2)}、`;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          case 'h3':
            level = 2;
            numbering.h3++;
            numbering.h4 = 0; // Reset H4 counter for this H3
            displayNumber = `${numbering.h3}. `;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          case 'h4':
            level = 3;
            numbering.h4++;
            displayNumber = `${numbering.h3}.${numbering.h4} `;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          default:
            numberedTitle = titleText;
            displayNumber = '';
        }
      }
      // 处理其他设置了 level 的组件（radio, checkbox, matrix, rate, sort, upload, blank, lesson_record）
      else if (q.level && q.level !== 'none' && autoNumbering) {
        switch (q.level) {
          case 'h2':
            level = 1;
            numbering.h2++;
            numbering.h3 = 0;
            numbering.h4 = 0;
            displayNumber = `${toChineseNumber(numbering.h2)}、`;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          case 'h3':
            level = 2;
            numbering.h3++;
            numbering.h4 = 0;
            displayNumber = `${numbering.h3}. `;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          case 'h4':
            level = 3;
            numbering.h4++;
            displayNumber = `${numbering.h3}.${numbering.h4} `;
            numberedTitle = `${displayNumber}${titleText}`;
            break;
          default:
            numberedTitle = titleText;
            displayNumber = '';
        }
      }
      // level === 'none' 或没有 level，不参与编号
      else {
        // 尝试从标题文本中检测级别（兼容性处理）
        if (titleText.match(/^[一二三四五六七八九十]+、/)) {
          level = 1;
        } else if (titleText.match(/^\d+\./)) {
          level = 2;
        }
        displayNumber = '';
      }

      questionNumbers[q.id] = displayNumber;

      return {
        id: q.id,
        title: numberedTitle,
        originalTitle: titleText,
        level,
        index,
        displayNumber
      };
    });

    return { outline, questionNumbers };
  }, [questions, autoNumbering]);

  // Add a new question
  const handleAddQuestion = (qType) => {
    const defaultProps = QUESTION_TYPES.find(t => t.type === qType)?.defaultProps || {};
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: qType,
      ...defaultProps
    };
    setQuestions([...questions, newQuestion]);
    setSelectedId(newQuestion.id);
  };

  // Update a question
  const updateQuestion = (id, newProps) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...newProps } : q));
  };

  // Delete a question
  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Copy a question
  const copyQuestion = (q) => {
    const newQ = { ...q, id: `q_${Date.now()}` };
    const idx = questions.findIndex(item => item.id === q.id);
    const newQs = [...questions];
    newQs.splice(idx + 1, 0, newQ);
    setQuestions(newQs);
    setSelectedId(newQ.id);
  };

  // Move up/down
  const moveQuestion = (index, direction) => {
    if (index === 0 && direction === -1) return;
    if (index === questions.length - 1 && direction === 1) return;
    const newQs = [...questions];
    const temp = newQs[index];
    newQs[index] = newQs[index + direction];
    newQs[index + direction] = temp;
    setQuestions(newQs);
  };

  const handleSave = () => {
    if (mode === 'board') {
      if (onCancel) onCancel();
      return;
    }
    if (mode === 'fill' && onSubmit) {
      onSubmit(answers);
    } else if (onSave) {
      onSave({ ...(initialData || {}), title, description, questions });
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedId);

  const [targetUsers, setTargetUsers] = useState(null);

  useEffect(() => {
    if (activeTab === 'analysis') {
      DataService.getAllUsers().then(async users => {
        const target = initialData?.publishConfig?.target;
        if (!target || target.type === 'all') {
          setTargetUsers(users);
        } else if (target.type === 'role') {
          const roleMap = { '教师': 'teacher', '区调研员': 'district_researcher', '区主任': 'district_director', '校长': 'principal' };
          const mappedRoles = target.roles.map(r => roleMap[r] || r);
          setTargetUsers(users.filter(u => mappedRoles.includes(u.role)));
        } else if (target.type === 'school') {
          setTargetUsers(users.filter(u => target.schools.includes(u.school)));
        } else if (target.type === 'user') {
          setTargetUsers(users.filter(u => target.userIds?.includes(u.id)));
        } else if (target.type === 'group') {
          const groups = DataService.getUserGroups ? await DataService.getUserGroups() : [];
          const selectedG = groups.filter(g => target.groupIds?.includes(g.id));
          const userIdsInGroups = new Set();
          selectedG.forEach(g => (g.members || []).forEach(id => userIdsInGroups.add(id)));
          setTargetUsers(users.filter(u => userIdsInGroups.has(u.id)));
        }
      }).catch(err => console.error("Failed to load target users", err));
    }
  }, [activeTab, initialData]);

  // Split questions into pages for preview
  const pages = [];
  let currentPage = [];
  questions.forEach(q => {
    if (q.type === 'pagination') {
      pages.push(currentPage);
      currentPage = [];
    } else {
      currentPage.push(q);
    }
  });
  if (currentPage.length > 0) pages.push(currentPage);

  const [previewPageIdx, setPreviewPageIdx] = useState(0);

  const handleExport = async () => {
    try {
      await exportReport(
        { title, description, pages },
        latestResponses,
        targetUsers || [],
        'word'
      );
    } catch (err) {
      alert('导出失败：' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Top Header */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {mode === 'fill' || mode === 'board' ? (
            <span className="text-lg font-bold truncate flex-1" title={title}>{title}</span>
          ) : (
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold border-none focus:ring-0 p-0 flex-1 min-w-0 bg-transparent"
              placeholder="点击编辑问卷标题"
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {mode !== 'fill' && (
            <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
              {activeTab === 'edit' && (
                <>
                  <button 
                    onClick={() => setShowComponentLibrary(!showComponentLibrary)}
                    className={`p-1.5 rounded-md ${showComponentLibrary ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="切换题型库面板"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowOutline(!showOutline)}
                    className={`p-1.5 rounded-md ${showOutline ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="切换大纲导航"
                  >
                    <ListTree className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setAutoNumbering(!autoNumbering)}
                    className={`p-1.5 rounded-md ${autoNumbering ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="切换自动编号"
                  >
                    <span className="text-xs font-medium">编号</span>
                  </button>
                  <div className="w-px bg-gray-300 mx-1 self-stretch my-1"></div>
                </>
              )}
              {mode !== 'board' && (
                <button 
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md ${activeTab === 'edit' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  编辑模式
                </button>
              )}
              <button 
                onClick={() => { setActiveTab('preview'); setPreviewPageIdx(0); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${activeTab === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Eye className="w-4 h-4" /> 问卷原卷
              </button>
              {hasPermission(user, 'canModifyStructure') && (
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${activeTab === 'analysis' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <BarChart2 className="w-4 h-4" /> 填报统计
                </button>
              )}
            </div>
          )}
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
          >
            <Save className="w-4 h-4" /> {mode === 'fill' ? '暂存' : mode === 'board' ? '返回' : '保存问卷'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {activeTab === 'edit' && (
          <>
            {/* Left Sidebar - Component Library */}
            {showComponentLibrary && (
              <div className="w-64 bg-white border-r shadow-sm flex flex-col h-full shrink-0 overflow-y-auto transition-all duration-300">
                <div className="p-4 border-b bg-gray-50 sticky top-0 z-10 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2"><Menu className="w-4 h-4"/> 题型库</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  {QUESTION_TYPES.map((qt) => (
                    <button
                      key={qt.type}
                      onClick={() => handleAddQuestion(qt.type)}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors bg-white group"
                    >
                      <qt.icon className="w-6 h-6 mb-2 text-gray-500 group-hover:text-blue-500" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{qt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 mt-auto">
                  <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100 leading-relaxed">
                    提示：点击左侧题型可将其添加到问卷中。在中间画布中选中题目可在右侧进行详细属性配置。
                  </div>
                </div>
              </div>
            )}

            {/* Left Sidebar 2 - Outline Navigation */}
            {showOutline && (
              <div className="w-64 bg-gray-50 border-r shadow-inner flex flex-col h-full shrink-0 overflow-y-auto transition-all duration-300">
                <div className="p-4 border-b bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2"><ListTree className="w-4 h-4 text-blue-600"/> 大纲导航</h3>
                </div>
                <div className="p-2 space-y-1">
                  {outline.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400 text-center">暂无大纲内容</div>
                  ) : (
                    outline.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedId(item.id);
                          document.getElementById(`question-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors truncate
                          ${selectedId === item.id ? 'bg-blue-100 text-blue-700 font-medium border-l-2 border-blue-500' : 'hover:bg-gray-200 text-gray-600 border-l-2 border-transparent'}
                          ${item.level === 1 ? 'pl-3 font-semibold' : item.level === 2 ? 'pl-6' : 'pl-9 text-xs'}
                        `}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Center Canvas */}
            <div className="flex-1 overflow-y-auto p-8 relative bg-gray-100 shadow-inner" onClick={() => setSelectedId(null)}>
              <div className="max-w-4xl w-full mx-auto space-y-4 pb-32">
                {questions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400">
                    <p className="mb-2">您的问卷还是空的</p>
                    <p className="text-sm">请从左侧点击题型进行添加</p>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div id={`question-${q.id}`} key={q.id}>
                      <QuestionRenderer
                        question={q}
                        index={null} // 禁用组件自带的全局自动编号
                        displayNumber={questionNumbers[q.id] || ''}
                        isEditMode={true}
                        userRole={user?.role}
                        isSelected={selectedId === q.id}
                        onSelect={(question) => { setSelectedId(question.id); }}
                        onDelete={deleteQuestion}
                        onCopy={copyQuestion}
                        onMoveUp={() => moveQuestion(idx, -1)}
                        onMoveDown={() => moveQuestion(idx, 1)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Properties */}
            {selectedId ? (
              <PropertyPanel 
                selectedQuestion={selectedQuestion} 
                updateQuestion={updateQuestion}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="w-80 bg-white border-l shadow-sm flex flex-col h-full shrink-0 justify-center items-center p-8 text-center border-dashed">
                <Settings2 className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">属性配置面板</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  请在中间画布中选中一个组件以配置其详细属性
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8">
            <div className="max-w-6xl w-full mx-auto bg-white rounded-xl shadow-lg min-h-screen border border-gray-200">
              {/* Header */}
              <div className="bg-blue-600 text-white p-8 rounded-t-xl text-center">
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                {description && <p className="text-blue-100 whitespace-pre-wrap">{description}</p>}
              </div>

              {/* Progress */}
              {pages.length > 1 && (
                <div className="px-8 pt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((previewPageIdx + 1) / pages.length) * 100}%` }}></div>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-2">进度: {previewPageIdx + 1} / {pages.length}</div>
                </div>
              )}

              {/* Questions Page */}
              <div className="p-8">
                {pages[previewPageIdx]?.map((q) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    index={null} // 禁用组件自带的全局自动编号
                    displayNumber={questionNumbers[q.id] || ''}
                    isEditMode={false}
                    userRole={user?.role}
                    currentUserId={user?.username}
                    currentUser={user}
                    value={answers[q.id]}
                    onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                    mode={mode}
                    responses={latestResponses.map(r => ({ userId: r.userId, userName: r.userName, time: r.time, answer: r.answers?.[q.id] })).filter(r => r.answer !== undefined && r.answer !== null && r.answer !== '')}
                  />
                ))}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between border-t pt-6">
                  {previewPageIdx > 0 ? (
                    <button onClick={() => setPreviewPageIdx(p => p - 1)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium">上一页</button>
                  ) : <div></div>}
                  
                  {previewPageIdx < pages.length - 1 ? (
                    <button onClick={() => setPreviewPageIdx(p => p + 1)} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm">下一页</button>
                  ) : (
                    mode !== 'board' && <button onClick={handleSave} className="px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium shadow-sm">{mode === 'fill' ? '提交问卷' : '完成预览'}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && hasPermission(user, 'canModifyStructure') && (
          <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header Stats */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-800">数据分析与完成情况报告</h2>
                  <div className="flex items-center gap-3 relative">
                    {onRefresh && (
                      <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium transition-colors">
                        <RefreshCw className="w-4 h-4" /> 刷新数据
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" /> 导出 Word
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <p className="text-blue-600 text-sm font-medium mb-2">收集总数 / 目标人数</p>
                    <p className="text-3xl font-bold text-blue-900">{latestResponses.length} / {targetUsers ? targetUsers.length : '-'}</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                    <p className="text-green-600 text-sm font-medium mb-2">平均完成时间</p>
                    <p className="text-3xl font-bold text-green-900">4分12秒</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col items-center justify-center">
                    <p className="text-purple-600 text-sm font-medium mb-2">完成率</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {targetUsers && targetUsers.length > 0 ? ((latestResponses.length / targetUsers.length) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Tracking */}
              {targetUsers && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">目标人群填报情况追踪</h3>
                  <div className="flex flex-wrap gap-4">
                    {(() => {
                      const respondedUserIds = new Set(responses.map(r => r.userId));
                      const missingUsers = targetUsers.filter(u => !respondedUserIds.has(u.username) && !respondedUserIds.has(u.id));
                      
                      if (missingUsers.length === 0) {
                        return <div className="text-green-600 font-medium w-full text-center py-4 bg-green-50 rounded">所有目标人员均已完成填报！🎉</div>;
                      }

                      return missingUsers.map(u => (
                        <div key={u.id} className="bg-red-50 border border-red-100 px-4 py-2 rounded-lg flex flex-col items-center">
                          <span className="font-semibold text-gray-800">{u.name}</span>
                          <span className="text-xs text-red-500 mt-1">未完成</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Question Analysis has been removed as per requirement */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
