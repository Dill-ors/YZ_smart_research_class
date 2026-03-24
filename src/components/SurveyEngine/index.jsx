import React, { useState, useEffect } from 'react';
import { Save, Eye, ArrowLeft, Download, BarChart2 } from 'lucide-react';
import { QUESTION_TYPES } from './QuestionTypes';
import QuestionRenderer from './QuestionRenderer';
import PropertyPanel from './PropertyPanel';
import { useAuth } from '../../context/AuthContext';

export default function SurveyEngine({ initialData, onSave, onSubmit, onCancel, mode = 'edit', responses = [] }) {
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
  const [description, setDescription] = useState(initialData?.description || '');

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

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Top Header */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {mode === 'fill' || mode === 'board' ? (
            <span className="text-lg font-bold w-64 truncate">{title}</span>
          ) : (
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold border-none focus:ring-0 p-0 w-64 bg-transparent"
              placeholder="点击编辑问卷标题"
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {mode !== 'fill' && mode !== 'board' && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md ${activeTab === 'edit' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                编辑模式
              </button>
              <button 
                onClick={() => { setActiveTab('preview'); setPreviewPageIdx(0); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${activeTab === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Eye className="w-4 h-4" /> 预览体验
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${activeTab === 'analysis' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <BarChart2 className="w-4 h-4" /> 数据分析
              </button>
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
            {/* Left Sidebar - Components */}
            <div className="w-64 bg-white border-r shadow-sm flex flex-col h-full overflow-y-auto">
              <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
                <h3 className="font-bold text-gray-700">题型库</h3>
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

            {/* Center Canvas */}
            <div className="flex-1 overflow-y-auto p-8" onClick={() => setSelectedId(null)}>
              <div className="max-w-3xl mx-auto space-y-4">
                {questions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400">
                    <p className="mb-2">您的问卷还是空的</p>
                    <p className="text-sm">请从左侧点击题型进行添加</p>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <QuestionRenderer
                      key={q.id}
                      question={q}
                      index={null} // 禁用组件自带的全局自动编号
                      isEditMode={true}
                      userRole={user?.role}
                      isSelected={selectedId === q.id}
                      onSelect={(question) => { setSelectedId(question.id); }}
                      onDelete={deleteQuestion}
                      onCopy={copyQuestion}
                      onMoveUp={() => moveQuestion(idx, -1)}
                      onMoveDown={() => moveQuestion(idx, 1)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Properties */}
            <PropertyPanel 
              selectedQuestion={selectedQuestion} 
              updateQuestion={updateQuestion}
              onClose={() => setSelectedId(null)}
            />
          </>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg min-h-screen border border-gray-200">
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
                {pages[previewPageIdx]?.map((q, i) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    index={null} // 禁用组件自带的全局自动编号
                    isEditMode={false}
                    userRole={user?.role}
                    currentUserId={user?.username}
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

        {activeTab === 'analysis' && (
          <div className="flex-1 bg-white p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">数据分析大屏 (模拟)</h2>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Download className="w-4 h-4" /> 导出 Excel
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium mb-2">收集总数</p>
                  <p className="text-3xl font-bold text-blue-900">1,284</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <p className="text-green-600 text-sm font-medium mb-2">平均完成时间</p>
                  <p className="text-3xl font-bold text-green-900">4分12秒</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <p className="text-purple-600 text-sm font-medium mb-2">完成率</p>
                  <p className="text-3xl font-bold text-purple-900">92.5%</p>
                </div>
              </div>

              <div className="space-y-8">
                {questions.filter(q => !['title', 'text', 'pagination'].includes(q.type)).map((q, idx) => (
                  <div key={q.id} className="border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">{q.label}</h3>
                    <div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 border border-dashed border-gray-200">
                      <BarChart2 className="w-8 h-8 mr-2" /> 图表分析区域占位
                    </div>
                  </div>
                ))}
                {questions.filter(q => ['radio', 'checkbox', 'rate', 'matrix'].includes(q.type)).length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    当前问卷没有可用于统计分析的选择题或评分题
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
