import React, { useState } from 'react';
import { GripVertical, Trash2, Copy, Star, Upload as UploadIcon, ChevronUp, ChevronDown, MessageSquare, Plus } from 'lucide-react';

export default function QuestionRenderer({ 
  question, 
  index, 
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
  const { type, label, required, allowedRoles, ...props } = question;

  // Determine if the current user can fill this question
  const canFill = isEditMode || !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(userRole);
  const isDisabled = isEditMode || !canFill || mode === 'board';

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
        const records = Array.isArray(value) ? value : [{ session: '第一节', grade: '', topic: '', teacher: '', advantages: '', problems: '' }];
        
        const handleRecordChange = (index, field, val) => {
          if (!onChange) return;
          const newRecords = [...records];
          newRecords[index] = { ...newRecords[index], [field]: val };
          onChange(newRecords);
        };

        const addRecord = () => {
          if (!onChange) return;
          const nextSessionMap = { '第一节': '第二节', '第二节': '第三节', '第三节': '第四节', '第四节': '第五节', '第五节': '第六节' };
          const lastSession = records[records.length - 1]?.session || '第一节';
          const nextSession = nextSessionMap[lastSession] || `第${records.length + 1}节`;
          onChange([...records, { session: nextSession, grade: '', topic: '', teacher: '', advantages: '', problems: '' }]);
        };

        const removeRecord = (index) => {
          if (!onChange) return;
          const newRecords = records.filter((_, i) => i !== index);
          if (newRecords.length === 0) {
            newRecords.push({ session: '第一节', grade: '', topic: '', teacher: '', advantages: '', problems: '' });
          }
          onChange(newRecords);
        };

        const subjectTitle = currentUser?.subject ? `${currentUser.subject}学科` : '学科';

        return (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2">
              (一) {subjectTitle}
            </h3>
            
            {records.map((record, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                {(!isDisabled || isEditMode) && records.length > 1 && (
                  <button 
                    onClick={() => removeRecord(idx)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除该节记录"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex flex-wrap items-center gap-3 mb-4 pr-8">
                  <div className="font-medium text-gray-700 w-16">
                    {idx + 1}. <input type="text" value={record.session} onChange={(e) => handleRecordChange(idx, 'session', e.target.value)} disabled={isDisabled} className="w-16 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center px-1" />：
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="年级" 
                      value={record.grade} 
                      onChange={(e) => handleRecordChange(idx, 'grade', e.target.value)}
                      disabled={isDisabled}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-gray-600 text-sm whitespace-nowrap">课题</span>
                    <input 
                      type="text" 
                      placeholder="《课题名称》" 
                      value={record.topic} 
                      onChange={(e) => handleRecordChange(idx, 'topic', e.target.value)}
                      disabled={isDisabled}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm whitespace-nowrap">执教教师：</span>
                    <input 
                      type="text" 
                      placeholder="教师姓名" 
                      value={record.teacher} 
                      onChange={(e) => handleRecordChange(idx, 'teacher', e.target.value)}
                      disabled={isDisabled}
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-3 ml-6">
                  <div>
                    <div className="text-gray-700 font-medium mb-1">(1) 主要优点：</div>
                    <textarea 
                      value={record.advantages} 
                      onChange={(e) => handleRecordChange(idx, 'advantages', e.target.value)}
                      disabled={isDisabled}
                      rows={3}
                      placeholder="请输入主要优点..."
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-y"
                    />
                  </div>
                  <div>
                    <div className="text-gray-700 font-medium mb-1">(2) 存在问题：</div>
                    <textarea 
                      value={record.problems} 
                      onChange={(e) => handleRecordChange(idx, 'problems', e.target.value)}
                      disabled={isDisabled}
                      rows={3}
                      placeholder="请输入存在问题..."
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {(!isDisabled || isEditMode) && (
              <button 
                type="button"
                onClick={addRecord}
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                添加下一节记录
              </button>
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
                {allRows.map((rowName, rIdx) => (
                  <tr key={rowName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50 break-words max-w-[150px]">
                      {rowName}
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
                            <textarea 
                              disabled={cellDisabled}
                              value={displayVal}
                              onChange={(e) => handleCellChange(e.target.value)}
                              placeholder={isOccupiedByOther ? `[${occupied.userName}] 已填` : ''}
                              rows={2}
                              className={`w-full min-w-[120px] border-gray-300 rounded shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${isOccupiedByOther ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-transparent' : 'bg-white'}`} 
                              title={isOccupiedByOther ? `由 ${occupied.userName} 填写` : ''}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!isDisabled && canFill && (
              <div className="mt-3 flex justify-start">
                <button 
                  type="button"
                  onClick={() => {
                    let baseName = currentUser?.subject || currentUser?.name || "新行";
                    let defaultName = baseName;
                    let counter = 1;
                    while(allRows.includes(defaultName)) {
                       defaultName = `${baseName} ${counter}`;
                       counter++;
                    }
                    
                    const rowName = prompt("请输入新行名称:", defaultName);
                    
                    if (rowName) {
                      if (allRows.includes(rowName)) {
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
              <div className="flex text-gray-300">
                {Array.from({ length: props.maxStar || 5 }).map((_, i) => (
                  <Star key={i} className="w-8 h-8 cursor-pointer hover:text-yellow-400" />
                ))}
              </div>
            )}
            {props.shape === 'number' && (
              <div className="flex gap-2">
                {Array.from({ length: props.maxStar || 5 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-gray-600">
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            {props.shape === 'slider' && (
              <input type="range" min="1" max={props.maxStar || 100} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" disabled={isDisabled} />
            )}
          </div>
        );

      case 'sort':
        return (
          <div className="space-y-2">
            {(props.options || []).map((opt, i) => (
              <div key={i} className="flex items-center p-3 border rounded bg-gray-50 border-gray-200 text-gray-700">
                <GripVertical className="w-4 h-4 text-gray-400 mr-2" />
                {opt}
              </div>
            ))}
            {isEditMode && <p className="text-xs text-gray-400 mt-2">提示：填卷人在真实页面可拖拽上述选项进行排序</p>}
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

        const addBlankRow = () => {
          if (!onChange) return;
          onChange([...blankValues, '']);
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
                <div key={idx} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder={props.placeholder || '请输入...'} 
                    disabled={isDisabled}
                    value={val}
                    onChange={(e) => handleBlankChange(idx, e.target.value)}
                    className={`border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex-1 ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                  />
                  {!isDisabled && blankValues.length > 1 && (
                    <button onClick={() => removeBlankRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {!isDisabled && (
                <button 
                  type="button"
                  onClick={addBlankRow}
                  className="text-blue-600 text-sm flex items-center hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors inline-flex mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加行
                </button>
              )}
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
              return otherVals.map((val, vIdx) => (
                <div key={`other-${i}-${vIdx}`} className="flex items-center gap-2">
                  <div className="flex items-center w-24 shrink-0 text-sm text-gray-500">
                    <span className="truncate" title={r.userName}>{r.userName}{otherVals.length > 1 ? ` (${vIdx + 1})` : ''}</span>
                  </div>
                  <input 
                    type="text" 
                    disabled 
                    value={String(val || '')}
                    className={`border border-gray-200 rounded-md bg-gray-50 px-3 py-2 cursor-not-allowed text-gray-600 sm:text-sm flex-1`} 
                  />
                </div>
              ));
            })}

            {/* Current user's slot */}
            {showMySlot && (
              <div className="w-full space-y-2">
                {blankValues.map((val, idx) => (
                  <div key={`my-${idx}`} className="flex items-center gap-2">
                    <div className="flex items-center w-24 shrink-0 text-sm font-medium text-blue-600">
                      <span className="truncate" title={userRole}>{currentUserId || '我'}{blankValues.length > 1 ? ` (${idx + 1})` : ''}</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder={props.placeholder || '请输入...'} 
                      disabled={isDisabled}
                      value={val}
                      onChange={(e) => handleBlankChange(idx, e.target.value)}
                      className={`border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex-1 ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                    />
                    {!isDisabled && blankValues.length > 1 && (
                      <button onClick={() => removeBlankRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!isDisabled && canFill && (
                  <div className="ml-26 pl-2">
                    <button 
                      type="button"
                      onClick={addBlankRow}
                      className="text-blue-600 text-sm flex items-center hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors inline-flex"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      添加行
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'textarea':
        if (isEditMode || mode === 'edit' || (!mode && !isEditMode)) {
          return (
            <textarea 
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
                <textarea 
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
                <textarea 
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
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 bg-white border rounded shadow hover:bg-gray-50 text-gray-500"><ChevronUp className="w-4 h-4"/></button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 bg-white border rounded shadow hover:bg-gray-50 text-gray-500"><ChevronDown className="w-4 h-4"/></button>
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

      {/* Board mode: show all responses for non-blank/textarea/matrix types */}
      {mode === 'board' && !['title', 'text', 'pagination', 'blank', 'textarea', 'matrix'].includes(type) && (
        <div className="mt-6 pl-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
            <div className="text-blue-800 mb-3 font-semibold flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
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
            onClick={(e) => { e.stopPropagation(); onCopy(question); }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
            title="复制"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
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
