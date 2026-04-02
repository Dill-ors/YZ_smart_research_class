import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, Trash2, Copy, Star, Upload as UploadIcon, ChevronUp, ChevronDown, Search, FileText, ChevronDown as ChevronDownIcon } from 'lucide-react';
import DataService from '../../services/dataService';
import RichTextEditor from '../RichTextEditor';

const AutoResizeTextarea = ({ value, onChange, disabled, placeholder, className, rows }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value || ''}
      onChange={(e) => onChange && onChange(e)}
      disabled={disabled}
      placeholder={placeholder}
      className={`${className} overflow-hidden resize-none`}
      rows={rows || 1}
    />
  );
};

export default function QuestionRenderer({ 
  question, 
  isEditMode, 
  isSelected, 
  onSelect, 
  onDelete, 
  onCopy,
  onMoveUp,
  onMoveDown,
  userRole,
  currentUserId,
  currentUser,
  value,
  onChange,
  mode,
  responses = []
}) {
  const { type, label, required, allowedRoles, allowedUsers, ...props } = question;

  // Determine if the current user can fill this question
  const noPermissionsSet = (!allowedRoles || allowedRoles.length === 0) && (!allowedUsers || allowedUsers.length === 0);
  const hasRoleAccess = allowedRoles && allowedRoles.includes(userRole);
  const hasUserAccess = allowedUsers && (allowedUsers.includes(currentUser?.id) || allowedUsers.includes(currentUser?.username));
  
  // 修复权限泄漏问题：如果指定了具体人员，则优先且仅匹配具体人员；如果没有指定人员，则按群体角色匹配
  const canFill = isEditMode || noPermissionsSet || (allowedUsers?.length > 0 ? hasUserAccess : hasRoleAccess);
  const isDisabled = isEditMode || !canFill || mode === 'board' || mode === 'view';

  // State for blank rich text expand
  const [expandedBlanks, setExpandedBlanks] = useState({});

  const toggleBlankExpand = (idx) => {
    setExpandedBlanks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Render content based on type
  const renderContent = () => {
    switch (type) {
      case 'title':
        return (
          <div className={`text-${props.align} mb-4`}>
            {props.level === 'h1' && <h1 className="text-3xl font-bold text-gray-900">{label}</h1>}
            {props.level === 'h2' && <h2 className="text-2xl font-semibold text-gray-800">{label}</h2>}
            {props.level === 'h3' && <h3 className="text-xl font-medium text-gray-800">{label}</h3>}
            {props.description && <p className="mt-2 text-gray-600 whitespace-pre-wrap">{props.description}</p>}
          </div>
        );

      case 'text':
        return (
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {props.content}
          </div>
        );

      case 'lesson_record': {
        const [isSelectorOpen, setIsSelectorOpen] = useState(false);
        const [historyRecords, setHistoryRecords] = useState([]);
        const [loadingHistory, setLoadingHistory] = useState(false);

        const fetchHistory = async () => {
          setLoadingHistory(true);
          try {
            await DataService.init();
            const all = await DataService.getSurveys({ observer: currentUser?.name });
            setHistoryRecords(all.filter(r => r.topic && r.teacher)); // Only keep those that look like lesson records
          } catch (e) {
            console.error("Failed to fetch history records", e);
          } finally {
            setLoadingHistory(false);
          }
        };

        const handleOpenSelector = () => {
          if (isDisabled) return;
          setIsSelectorOpen(true);
          if (historyRecords.length === 0) {
            fetchHistory();
          }
        };

        const handleSelectRecord = (record) => {
          if (!onChange) return;
          const currentSelection = Array.isArray(value) ? value : [];
          // Avoid duplicate selection
          if (!currentSelection.find(r => r.id === record.id)) {
            onChange([...currentSelection, record]);
          }
          setIsSelectorOpen(false);
        };

        const removeSelected = (id) => {
          if (!onChange || isDisabled) return;
          const currentSelection = Array.isArray(value) ? value : [];
          onChange(currentSelection.filter(r => r.id !== id));
        };

        const selectedRecords = Array.isArray(value) ? value : [];
        const boardRecords = mode === 'board' ? responses.flatMap(r => {
          const ans = Array.isArray(r.answer) ? r.answer : [];
          return ans.map(a => {
            if (typeof a === 'string') {
              return { id: a, topic: '历史记录', submitterName: r.userName || r.userId };
            }
            return { ...a, submitterName: r.userName || r.userId };
          });
        }) : [];
        
        const displayRecords = mode === 'board' ? boardRecords : selectedRecords;

        if (isEditMode) {
          return (
            <div className="p-6 bg-blue-50 border border-blue-200 border-dashed rounded-lg text-center text-blue-600 flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-medium">听课记录引用组件</p>
              <p className="text-sm text-blue-500 mt-1">填报者将在此处从其个人历史记录中选择已填写的听课记录。</p>
            </div>
          );
        }

        return (
          <div className="space-y-4 relative">
            {displayRecords.length > 0 && (
              <div className="space-y-3">
                {displayRecords.map((record, idx) => {
                  const recordId = record.id || (typeof record === 'string' ? record : null);
                  const isBoardMode = mode === 'board';
                  const url = isBoardMode && recordId ? `${import.meta.env.BASE_URL}observations/fill/${recordId}?mode=board`.replace(/\/\//g, '/') : undefined;
                  
                  const content = (
                    <div 
                      key={record.id || idx} 
                      className={`bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex justify-between items-start group ${isBoardMode ? 'cursor-pointer hover:border-blue-400 hover:shadow-md transition-all' : ''}`}
                    >
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">记录 {idx + 1}</span>
                          {record.topic}
                          {record.submitterName && <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">提交人: {record.submitterName}</span>}
                        </div>
                        <div className="text-sm text-gray-500 mt-2 flex gap-4">
                          <span>执教：{record.teacher}</span>
                          <span>学科：{record.subject}</span>
                          <span>时间：{record.date}</span>
                        </div>
                      </div>
                      {!isDisabled && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSelected(record.id);
                          }}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="移除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );

                  return isBoardMode && url ? (
                    <a 
                      key={recordId || idx} 
                      href={url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block outline-none"
                    >
                      {content}
                    </a>
                  ) : (
                    <React.Fragment key={recordId || idx}>
                      {content}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            
            {(!isDisabled) && (
              <button 
                type="button"
                onClick={handleOpenSelector}
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                {selectedRecords.length > 0 ? '继续选择听课记录' : '点击选择听课记录'}
              </button>
            )}

            {isSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0">
                  <h4 className="font-medium text-gray-700">选择听课记录</h4>
                  <button type="button" onClick={() => setIsSelectorOpen(false)} className="text-gray-400 hover:text-gray-600">
                    关闭
                  </button>
                </div>
                <div className="p-2">
                  {loadingHistory ? (
                    <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">暂无听课记录</div>
                  ) : (
                    <div className="space-y-1">
                      {historyRecords.map(record => {
                        const isSelected = selectedRecords.find(r => r.id === record.id);
                        return (
                          <div 
                            key={record.id}
                            onClick={() => !isSelected && handleSelectRecord(record)}
                            className={`p-3 rounded-md flex justify-between items-center cursor-pointer transition-colors ${
                              isSelected ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-blue-50 border border-transparent hover:border-blue-100'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{record.topic || '无课题'}</div>
                              <div className="text-xs text-gray-500 mt-1">{record.date} | {record.school} | {record.teacher}</div>
                            </div>
                            {isSelected && <span className="text-xs text-green-600 font-medium">已选择</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'radio':
      case 'checkbox': {
        const InputType = type === 'radio' ? 'radio' : 'checkbox';
        const isHorizontal = props.layout === 'horizontal';
        
        const handleCheckChange = (opt, checked) => {
          if (!onChange) return;
          if (type === 'radio') {
            onChange(opt);
          } else {
            const currentArr = Array.isArray(value) ? value : [];
            if (checked) {
              onChange([...currentArr, opt]);
            } else {
              onChange(currentArr.filter(item => item !== opt));
            }
          }
        };

        return (
          <div className={`flex ${isHorizontal ? 'flex-row flex-wrap gap-6' : 'flex-col gap-3'}`}>
            {(props.options || []).map((opt, i) => {
              const isChecked = type === 'radio' ? value === opt : (Array.isArray(value) && value.includes(opt));
              return (
                <label key={i} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type={InputType} 
                    name={type === 'radio' ? `q_${question.id}` : undefined}
                    className={`text-blue-600 focus:ring-blue-500 ${type === 'radio' ? 'h-4 w-4' : 'h-4 w-4 rounded'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isDisabled}
                    checked={isChecked}
                    onChange={(e) => handleCheckChange(opt, e.target.checked)}
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'matrix':
        const matrixResponses = (mode === 'board' || mode === 'fill') ? responses : [];
        
        let customRows = [];
        matrixResponses.forEach(r => {
          const qAnswer = r.answer;
          if (qAnswer && qAnswer.addedRows) {
            qAnswer.addedRows.forEach(rowName => {
              if (!customRows.includes(rowName)) customRows.push(rowName);
            });
          }
        });
        if (value && value.addedRows) {
          value.addedRows.forEach(rowName => {
            if (!customRows.includes(rowName)) customRows.push(rowName);
          });
        }
        
        const allRows = [...(props.rows || []), ...customRows];

        const occupiedCells = {};
        matrixResponses.forEach(r => {
          const qAnswer = r.answer;
          if (qAnswer && qAnswer.cells) {
            Object.entries(qAnswer.cells).forEach(([key, val]) => {
              if (val !== undefined && val !== '' && val !== false) {
                 if (!occupiedCells[key] || occupiedCells[key].userId === r.userId) {
                    occupiedCells[key] = { userId: r.userId, userName: r.userName, val };
                 }
              }
            });
          }
        });

        return (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md shadow-sm">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">{props.topLeftLabel || ''}</th>
                  {(props.cols || []).map((col, cIdx) => (
                    <th key={cIdx} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allRows.map((rowName) => {
                  const isMyCustomRow = value?.addedRows?.includes(rowName);
                  return (
                  <tr key={rowName} className="hover:bg-gray-50 relative group">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50 break-words max-w-[150px] relative">
                      {rowName}
                      {!isDisabled && isMyCustomRow && (
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!onChange) return;
                            const currentAdded = value.addedRows.filter(r => r !== rowName);
                            const newCells = { ...value.cells };
                            // Remove cells associated with this row
                            Object.keys(newCells).forEach(key => {
                              if (key.startsWith(`${rowName}_`)) {
                                delete newCells[key];
                              }
                            });
                            onChange({ ...value, addedRows: currentAdded, cells: newCells });
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="删除该行"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    {(props.cols || []).map((col, cIdx) => {
                      const cellKey = `${rowName}_${cIdx}`;
                      const occupied = occupiedCells[cellKey];
                      const isMe = occupied ? occupied.userId === currentUserId : false;
                      const isOccupiedByOther = occupied && !isMe;
                      
                      const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
                        ? value.cells[cellKey] 
                        : (isMe ? occupied.val : '');
                        
                      const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
                      const displayVal = hasLocalValue ? myVal : (occupied ? occupied.val : '');
                        
                      const cellDisabled = isDisabled || isOccupiedByOther;

                      const handleCellChange = (newVal) => {
                        if (!onChange) return;
                        const currentCells = (value && value.cells) ? { ...value.cells } : {};
                        currentCells[cellKey] = newVal;
                        
                        if (currentUser?.subject) {
                          const subjectColIdx = (props.cols || []).findIndex(c => c.includes('学科') || c.includes('科目'));
                          if (subjectColIdx !== -1) {
                            const subjKey = `${rowName}_${subjectColIdx}`;
                            if (!currentCells[subjKey]) {
                              currentCells[subjKey] = currentUser.subject;
                            }
                          }
                        }

                        onChange({ ...(value || {}), cells: currentCells });
                      };

                      const handleRadioChange = () => {
                        if (!onChange) return;
                        const currentCells = (value && value.cells) ? { ...value.cells } : {};
                        (props.cols || []).forEach((_, c) => {
                          delete currentCells[`${rowName}_${c}`];
                        });
                        currentCells[cellKey] = true;
                        
                        if (currentUser?.subject) {
                          const subjectColIdx = (props.cols || []).findIndex(c => c.includes('学科') || c.includes('科目'));
                          if (subjectColIdx !== -1) {
                            const subjKey = `${rowName}_${subjectColIdx}`;
                            if (!currentCells[subjKey]) {
                              currentCells[subjKey] = currentUser.subject;
                            }
                          }
                        }

                        onChange({ ...(value || {}), cells: currentCells });
                      };

                      return (
                        <td key={cIdx} className="px-2 py-2 text-center border-r border-gray-200 relative group" title={isOccupiedByOther ? `由 ${occupied.userName} 填写` : ''}>
                          {props.mode === 'radio' && (
                            <input 
                              type="radio" 
                              name={`m_${question.id}_${rowName}`} 
                              disabled={cellDisabled}
                              checked={hasLocalValue ? myVal === true : occupied?.val === true}
                              onChange={handleRadioChange}
                              className="text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer disabled:cursor-not-allowed" 
                            />
                          )}
                          {props.mode === 'checkbox' && (
                            <input 
                              type="checkbox" 
                              disabled={cellDisabled}
                              checked={hasLocalValue ? myVal === true : occupied?.val === true}
                              onChange={(e) => handleCellChange(e.target.checked)}
                              className="text-blue-600 focus:ring-blue-500 h-4 w-4 rounded cursor-pointer disabled:cursor-not-allowed" 
                            />
                          )}
                          {props.mode === 'input' && (
                            <AutoResizeTextarea 
                              disabled={cellDisabled}
                              value={displayVal}
                              onChange={(e) => handleCellChange(e.target.value)}
                              placeholder={isOccupiedByOther ? `[${occupied.userName}] 已填` : ''}
                              rows={2}
                              className={`w-full min-w-[120px] border-gray-300 rounded shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${isOccupiedByOther ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-transparent' : 'bg-white'}`} 
                              title={isOccupiedByOther ? `由 ${occupied.userName} 填写` : ''}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
                })}
              </tbody>
            </table>
            
            {!isDisabled && canFill && (!value?.addedRows || value.addedRows.length < 1) && (
              <div className="mt-3 flex justify-start">
                <button 
                  type="button"
                  onClick={() => {
                    let baseName = "新行";
                    if (props.topLeftLabel) {
                      if (props.topLeftLabel.includes('学科') || props.topLeftLabel.includes('科目')) {
                        baseName = currentUser?.subject || currentUser?.name || "新行";
                      } else if (props.topLeftLabel.includes('序号')) {
                        baseName = (allRows.length + 1).toString();
                      }
                    }
                    let rowName = baseName;
                    
                    // Automatically use the baseName without prompt if not in edit mode
                    if (isEditMode) {
                      let defaultName = baseName;
                      let counter = 1;
                      while(allRows.includes(defaultName)) {
                         defaultName = `${baseName} ${counter}`;
                         counter++;
                      }
                      rowName = prompt("请输入新行名称:", defaultName);
                    } else {
                      let counter = 1;
                      while(allRows.includes(rowName)) {
                         rowName = `${baseName} ${counter}`;
                         counter++;
                      }
                    }
                    
                    if (rowName) {
                      if (isEditMode && allRows.includes(rowName)) {
                        alert("行名称已存在或无效！");
                        return;
                      }
                      
                      const currentAdded = (value && value.addedRows) ? value.addedRows : [];
                      const newCells = (value && value.cells) ? { ...value.cells } : {};
                      
                      if (currentUser?.subject) {
                        const subjectColIdx = (props.cols || []).findIndex(c => c.includes('学科') || c.includes('科目'));
                        if (subjectColIdx !== -1) {
                          newCells[`${rowName}_${subjectColIdx}`] = currentUser.subject;
                        }
                      }
                      
                      const serialColIdx = (props.cols || []).findIndex(c => c.includes('序号'));
                      if (serialColIdx !== -1) {
                        newCells[`${rowName}_${serialColIdx}`] = allRows.length + 1;
                      }

                      if (onChange) {
                        onChange({
                          ...(value || {}),
                          addedRows: [...currentAdded, rowName],
                          cells: newCells
                        });
                      }
                    }
                  }}
                  className="text-blue-600 text-sm flex items-center hover:text-blue-800 font-medium px-3 py-1.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  添加新行
                </button>
              </div>
            )}
          </div>
        );

      case 'rate':
        return (
          <div className="flex items-center gap-2">
            {props.shape === 'star' && (
              <div className="flex">
                {Array.from({ length: props.maxStar || 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-8 h-8 ${!isDisabled ? 'cursor-pointer' : ''} ${value > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    onClick={() => {
                      if (!isDisabled && onChange) onChange(i + 1);
                    }}
                  />
                ))}
              </div>
            )}
            {props.shape === 'number' && (
              <div className="flex gap-2">
                {Array.from({ length: props.maxStar || 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-10 h-10 flex items-center justify-center border rounded ${!isDisabled ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' : ''} ${value === i + 1 ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600'}`}
                    onClick={() => {
                      if (!isDisabled && onChange) onChange(i + 1);
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            {props.shape === 'slider' && (
              <div className="w-full flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max={props.maxStar || 100} 
                  value={value || 1}
                  onChange={(e) => {
                    if (!isDisabled && onChange) onChange(parseInt(e.target.value, 10));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                  disabled={isDisabled} 
                />
                <span className="text-gray-600 font-medium w-8 text-right">{value || 1}</span>
              </div>
            )}
          </div>
        );

      case 'sort':
        // For sort questions, the user needs to reorder options.
        // In view mode or board mode, display the sorted list.
        const sortValues = Array.isArray(value) && value.length > 0 ? value : (props.options || []);
        
        const moveSortItem = (index, direction) => {
          if (!onChange || isDisabled) return;
          const newIndex = index + direction;
          if (newIndex < 0 || newIndex >= sortValues.length) return;
          
          const newValues = [...sortValues];
          const temp = newValues[index];
          newValues[index] = newValues[newIndex];
          newValues[newIndex] = temp;
          
          onChange(newValues);
        };

        return (
          <div className="space-y-2">
            {sortValues.map((opt, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded bg-white border-gray-200 text-gray-700 shadow-sm transition-all hover:border-blue-300">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold mr-3">{i + 1}</span>
                  {opt}
                </div>
                {!isDisabled && !isEditMode && (
                  <div className="flex flex-col">
                    <button 
                      type="button"
                      onClick={() => moveSortItem(i, -1)}
                      disabled={i === 0}
                      className={`p-1 ${i === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => moveSortItem(i, 1)}
                      disabled={i === sortValues.length - 1}
                      className={`p-1 ${i === sortValues.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isEditMode && <p className="text-xs text-gray-400 mt-2">提示：填卷人在真实页面可点击箭头进行排序</p>}
          </div>
        );

      case 'upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
            <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm font-medium">点击或拖拽文件到此处上传</p>
            <p className="text-xs mt-1">支持格式: {props.accept}，最多 {props.maxFiles} 个，单个不超过 {props.maxSize}MB</p>
          </div>
        );

      case 'blank':
        const blankValues = Array.isArray(value) ? value : (value !== undefined && value !== null && value !== '' ? [value] : ['']);
        
        const handleBlankChange = (index, newVal) => {
          if (!onChange) return;
          const newValues = [...blankValues];
          newValues[index] = newVal;
          onChange(newValues);
        };

        const removeBlankRow = (index) => {
          if (!onChange) return;
          const newValues = blankValues.filter((_, i) => i !== index);
          onChange(newValues.length > 0 ? newValues : ['']);
        };

        if (isEditMode || mode === 'edit' || (!mode && !isEditMode)) {
          return (
            <div className="w-full space-y-2">
              {blankValues.map((val, idx) => (
                <div key={idx} className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder={props.placeholder || '请输入...'} 
                      disabled={isDisabled}
                      value={val}
                      onChange={(e) => handleBlankChange(idx, e.target.value)}
                      className={`border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex-1 ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    />
                    {!isDisabled && (
                      <button 
                        type="button" 
                        onClick={() => toggleBlankExpand(idx)} 
                        className={`p-2 rounded text-gray-500 hover:bg-gray-100 ${expandedBlanks[idx] ? 'bg-gray-100' : ''}`}
                        title="高级编辑"
                      >
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedBlanks[idx] ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    {!isDisabled && blankValues.length > 1 && (
                      <button type="button" onClick={() => removeBlankRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {expandedBlanks[idx] && !isDisabled && (
                    <div className="w-full animate-in fade-in slide-in-from-top-2">
                      <RichTextEditor 
                        value={val} 
                        onChange={(newVal) => handleBlankChange(idx, newVal)} 
                        disabled={isDisabled} 
                        placeholder={props.placeholder || '请输入详细内容...'}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        const otherResponses = responses.filter(r => r.userId !== currentUserId && r.answer !== undefined && r.answer !== '' && (!Array.isArray(r.answer) || r.answer.length > 0));
        const myResponse = responses.find(r => r.userId === currentUserId);
        const hasOthers = otherResponses.length > 0;
        const showMySlot = (canFill && !isEditMode && mode !== 'board') || myResponse;
        
        return (
          <div className="w-full space-y-3">
            {/* Show other people's occupied slots */}
            {hasOthers && otherResponses.map((r, i) => {
              const otherVals = Array.isArray(r.answer) ? r.answer : [r.answer];
              return otherVals.map((val, vIdx) => {
                const expandKey = `other_${i}_${vIdx}`;
                return (
                <div key={`other-${i}-${vIdx}`} className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center w-24 shrink-0 text-sm text-gray-500">
                      <span className="truncate" title={r.userName}>{r.userName}{otherVals.length > 1 ? ` (${vIdx + 1})` : ''}</span>
                    </div>
                    <input 
                      type="text" 
                      disabled 
                      value={val ? String(val).replace(/<[^>]*>?/gm, '') : ''}
                      className={`border border-gray-200 rounded-md bg-gray-50 px-3 py-2 cursor-not-allowed text-gray-600 sm:text-sm flex-1`} 
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleBlankExpand(expandKey)} 
                      className={`p-2 rounded text-gray-500 hover:bg-gray-100 ${expandedBlanks[expandKey] ? 'bg-gray-100' : ''}`}
                      title="查看详细内容"
                    >
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedBlanks[expandKey] ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {expandedBlanks[expandKey] && (
                    <div className="w-full pl-26 ml-2 animate-in fade-in slide-in-from-top-2">
                      <RichTextEditor 
                        value={val} 
                        onChange={() => {}}
                        disabled={true} 
                        placeholder="无内容"
                      />
                    </div>
                  )}
                </div>
              )});
            })}

            {/* Current user's slot */}
            {showMySlot && (
              <div className="w-full space-y-2">
                {blankValues.map((val, idx) => {
                  const expandKey = `my_${idx}`;
                  return (
                  <div key={expandKey} className="flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center w-24 shrink-0 text-sm font-medium text-blue-600">
                        <span className="truncate" title={userRole}>{currentUserId || '我'}{blankValues.length > 1 ? ` (${idx + 1})` : ''}</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder={props.placeholder || '请输入...'} 
                        disabled={isDisabled}
                        value={val ? val.replace(/<[^>]*>?/gm, '') : ''}
                        onChange={(e) => handleBlankChange(idx, e.target.value)}
                        className={`border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex-1 ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                      />
                      {(!isDisabled || mode === 'board') && (
                        <button 
                          type="button" 
                          onClick={() => toggleBlankExpand(expandKey)} 
                          className={`p-2 rounded text-gray-500 hover:bg-gray-100 ${expandedBlanks[expandKey] ? 'bg-gray-100' : ''}`}
                          title={isDisabled ? "查看详细内容" : "高级编辑"}
                        >
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedBlanks[expandKey] ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      {!isDisabled && blankValues.length > 1 && (
                        <button type="button" onClick={() => removeBlankRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {expandedBlanks[expandKey] && (
                      <div className="w-full pl-26 ml-2 animate-in fade-in slide-in-from-top-2">
                        <RichTextEditor 
                          value={val} 
                          onChange={(newVal) => handleBlankChange(idx, newVal)} 
                          disabled={isDisabled} 
                          placeholder={props.placeholder || '请输入详细内容...'}
                        />
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        );

      case 'textarea':
        if (isEditMode || mode === 'edit' || (!mode && !isEditMode)) {
          return (
            <AutoResizeTextarea 
              placeholder={props.placeholder || '请输入详细内容...'} 
              disabled={isDisabled}
              value={value || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              className={`w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
              rows={4}
            />
          );
        }

        const otherTextResponses = responses.filter(r => r.userId !== currentUserId && r.answer !== undefined && r.answer !== '');
        const myTextResponse = responses.find(r => r.userId === currentUserId);
        const hasOtherTexts = otherTextResponses.length > 0;
        const showMyTextSlot = (canFill && !isEditMode && mode !== 'board') || myTextResponse;

        return (
          <div className="w-full space-y-4">
            {hasOtherTexts && otherTextResponses.map((r, i) => (
              <div key={`other-txt-${i}`} className="flex flex-col gap-1">
                <div className="text-sm text-gray-500 font-medium">
                  {r.userName}
                </div>
                <AutoResizeTextarea 
                  disabled
                  value={String(r.answer || '')}
                  className="w-full border border-gray-200 rounded-md bg-gray-50 px-3 py-2 cursor-not-allowed text-gray-600 sm:text-sm" 
                  rows={2}
                />
              </div>
            ))}

            {showMyTextSlot && (
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-blue-600">
                  {currentUserId || '我'}
                </div>
                <AutoResizeTextarea 
                  placeholder={props.placeholder || '请输入详细内容...'} 
                  disabled={isDisabled}
                  value={value || ''}
                  onChange={(e) => onChange && onChange(e.target.value)}
                  className={`w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                  rows={4}
                />
              </div>
            )}
          </div>
        );

      case 'pagination':
        return (
          <div className="flex items-center justify-between border-t-2 border-b-2 border-dashed border-blue-200 py-4 my-4 bg-blue-50">
            <span className="font-bold text-blue-600 ml-4">=== 分页符 ===</span>
            {props.showProgress && <span className="text-xs text-blue-500 mr-4">显示进度条</span>}
          </div>
        );

      default:
        return <div className="text-red-500">未知题型</div>;
    }
  };

  const Wrapper = isEditMode ? 'div' : 'div';

  return (
    <Wrapper
      onClick={isEditMode ? (e) => { e.stopPropagation(); onSelect(question); } : undefined}
      className={`relative p-6 bg-white rounded-lg transition-all ${
        isEditMode ? 'cursor-pointer border-2 hover:border-blue-300' : 'mb-6 shadow-sm border border-gray-200'
      } ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-transparent'}`}
    >
      {/* Edit Mode Hover/Selected Overlay */}
      {isEditMode && isSelected && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 bg-white border rounded shadow hover:bg-gray-50 text-gray-500"><ChevronUp className="w-4 h-4"/></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 bg-white border rounded shadow hover:bg-gray-50 text-gray-500"><ChevronDown className="w-4 h-4"/></button>
        </div>
      )}

      {/* Question Header (except for Title, Text, Pagination) */}
      {!['title', 'text', 'pagination'].includes(type) && (
        <div className={`flex items-start ${type === 'blank' && props.layout === 'horizontal' ? 'items-center mb-0' : 'mb-4'}`}>
          <div className={`font-semibold text-gray-800 text-lg ${type === 'blank' && props.layout === 'horizontal' ? 'mr-4 whitespace-nowrap' : 'flex-1'}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {type === 'blank' && props.layout === 'horizontal' && (
            <div className="flex-1">
              {renderContent()}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {!(type === 'blank' && props.layout === 'horizontal') && (
        <div className={['title', 'text', 'pagination'].includes(type) ? '' : 'pl-6'}>
          {renderContent()}
        </div>
      )}

      {/* Board mode: show all responses for non-blank/textarea/matrix/lesson_record types */}
      {mode === 'board' && !['title', 'text', 'pagination', 'blank', 'textarea', 'matrix', 'lesson_record'].includes(type) && (
        <div className="mt-6 pl-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
            <div className="text-blue-800 mb-3 font-semibold flex items-center">
              全部填写记录 ({responses.length}份)
            </div>
            {responses.length === 0 ? (
              <div className="text-blue-500 italic">暂无数据</div>
            ) : (
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {responses.map((r, i) => {
                  const isMe = r.userId === currentUserId;
                  return (
                    <li key={i} className={`flex gap-3 border-b border-blue-100 last:border-0 pb-2 last:pb-0 ${isMe ? 'font-bold' : ''}`}>
                      <span className="text-blue-600 w-24 shrink-0 truncate font-medium" title={r.userName}>
                        {r.userName} {isMe && '(我)'}:
                      </span>
                      <span className="text-gray-800 flex-1 break-words">
                        {typeof r.answer === 'object' ? JSON.stringify(r.answer) : String(r.answer)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Edit Mode Actions */}
      {isEditMode && isSelected && (
        <div className="absolute right-4 top-4 flex gap-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onCopy(question); }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
            title="复制"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Wrapper>
  );
}
