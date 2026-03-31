import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DataService from '../../services/dataService';

export default function PropertyPanel({ selectedQuestion, updateQuestion, onClose, disablePermissions }) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await DataService.getAllUsers();
        setAllUsers(users);
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    };
    fetchUsers();
  }, []);
  
  if (!selectedQuestion) {
    return (
      <div className="w-80 bg-white border-l shadow-sm p-6 flex flex-col items-center justify-center text-gray-400">
        <p>请在左侧或中间选中一个题目</p>
        <p>以编辑其属性</p>
      </div>
    );
  }

  const { id, type, ...props } = selectedQuestion;

  const handleChange = (field, value) => {
    updateQuestion(id, { ...props, [field]: value });
  };

  const ROLES = [
    { value: 'admin', label: '管理员' },
    { value: 'district_director', label: '区主任' },
    { value: 'district_researcher', label: '区调研员' },
    { value: 'principal', label: '校长' },
    { value: 'teacher', label: '教师' }
  ];

  const handleRoleToggle = (roleValue) => {
    const currentRoles = props.allowedRoles || [];
    const newRoles = currentRoles.includes(roleValue)
      ? currentRoles.filter(r => r !== roleValue)
      : [...currentRoles, roleValue];
    handleChange('allowedRoles', newRoles);
  };

  const handleArrayChange = (field, index, value) => {
    const newArr = [...(props[field] || [])];
    newArr[index] = value;
    handleChange(field, newArr);
  };

  const handleAddArrayItem = (field, defaultLabel) => {
    const currentArr = props[field] || [];
    const newArr = [...currentArr, `${defaultLabel} ${currentArr.length + 1}`];
    handleChange(field, newArr);
  };

  const handleRemoveArrayItem = (field, index) => {
    const newArr = (props[field] || []).filter((_, i) => i !== index);
    handleChange(field, newArr);
  };

  return (
    <div className="w-80 bg-white border-l shadow-sm flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700">属性配置</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Role Permissions (Only visible to admin-level roles) */}
        {!disablePermissions && user?.role && ['admin', 'district_director', 'principal'].includes(user.role) && !['title', 'text', 'pagination'].includes(type) && (
          <div className="bg-blue-50 -mx-4 px-4 py-4 border-y border-blue-100 mb-6">
            <label className="flex items-center text-sm font-semibold text-blue-800 mb-3">
              <Shield className="w-4 h-4 mr-2" /> 填写权限控制
            </label>
            <p className="text-xs text-blue-600 mb-3">指定哪些角色可以填写此题。若不勾选，则所有能看到问卷的人都能填写。</p>
            <div className="space-y-2">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={(props.allowedRoles || []).includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="text-blue-600 focus:ring-blue-500 rounded h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <label className="flex items-center text-sm font-semibold text-blue-800 mb-2">
                <User className="w-4 h-4 mr-2" /> 指定具体人员
              </label>
              <p className="text-xs text-blue-600 mb-2">精确指定到具体人员。注意：若勾选了具体人员，则该题仅限这些指定人员填写（上方勾选的群体角色会被覆盖）。</p>
              
              <div className="max-h-40 overflow-y-auto border border-blue-200 bg-white rounded p-2 space-y-1">
                {allUsers.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-2">加载中...</div>
                ) : (
                  allUsers.map(u => {
                    const roleLabel = ROLES.find(r => r.value === u.role)?.label || u.role;
                    const suffix = u.school ? `${u.school} - ${roleLabel}` : roleLabel;
                    return (
                      <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-blue-50 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(props.allowedUsers || []).includes(u.id)}
                          onChange={() => {
                            const currentUsers = props.allowedUsers || [];
                            const newUsers = currentUsers.includes(u.id)
                              ? currentUsers.filter(id => id !== u.id)
                              : [...currentUsers, u.id];
                            handleChange('allowedUsers', newUsers);
                          }}
                          className="text-blue-600 focus:ring-blue-500 rounded h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">{u.name} <span className="text-xs text-gray-400">({suffix})</span></span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Common: Label */}
        {type !== 'pagination' && type !== 'lesson_record' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题/问题内容</label>
            <textarea 
              value={props.label || ''} 
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={3}
            />
          </div>
        )}
        
        {/* Lesson Record Label */}
        {type === 'lesson_record' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模块名称</label>
            <input 
              type="text"
              value={props.label || ''} 
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">注：系统会自动在前端为填报老师添加“(一) [学科]学科”前缀</p>
          </div>
        )}

        {/* Common: Required */}
        {props.hasOwnProperty('required') && (
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="req"
              checked={props.required} 
              onChange={(e) => handleChange('required', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="req" className="ml-2 text-sm text-gray-700">必填项</label>
          </div>
        )}



        {/* Specific: Title */}
        {type === 'title' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题级别</label>
              <select 
                value={props.level} 
                onChange={(e) => handleChange('level', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="h1">主标题 (H1)</option>
                <option value="h2">副标题 (H2)</option>
                <option value="h3">小标题 (H3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">对齐方式</label>
              <select 
                value={props.align} 
                onChange={(e) => handleChange('align', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="left">居左</option>
                <option value="center">居中</option>
                <option value="right">居右</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述说明</label>
              <textarea 
                value={props.description || ''} 
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={4}
              />
            </div>
          </>
        )}

        {/* Specific: Text */}
        {type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正文内容 (支持换行)</label>
            <textarea 
              value={props.content || ''} 
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={6}
            />
          </div>
        )}

        {/* Specific: Blank Placeholder */}
        {type === 'blank' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">提示文字 (Placeholder)</label>
            <input 
              type="text" 
              value={props.placeholder || ''} 
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        )}

        {/* Options Editor (Radio, Checkbox, Sort) */}
        {['radio', 'checkbox', 'sort'].includes(type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选项设置</label>
            <div className="space-y-2">
              {(props.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={opt}
                    onChange={(e) => handleArrayChange('options', idx, e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button type="button" onClick={() => handleRemoveArrayItem('options', idx)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => handleAddArrayItem('options', '新选项')}
                className="text-blue-500 text-sm flex items-center mt-2 hover:underline"
              >
                <Plus className="w-4 h-4 mr-1" /> 添加选项
              </button>
            </div>
          </div>
        )}

        {/* Matrix Rows & Cols */}
        {type === 'matrix' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">矩阵模式</label>
              <select 
                value={props.mode} 
                onChange={(e) => handleChange('mode', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-4"
              >
                <option value="radio">单选模式</option>
                <option value="checkbox">多选模式</option>
                <option value="input">文本输入模式</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">首列标题 (第一行第一列)</label>
              <input 
                type="text" 
                value={props.topLeftLabel || ''} 
                onChange={(e) => handleChange('topLeftLabel', e.target.value)}
                placeholder="例如: 选项 / 评价"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">行选项 (Rows)</label>
              <div className="space-y-2">
                {(props.rows || []).map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={row}
                      onChange={(e) => handleArrayChange('rows', idx, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button type="button" onClick={() => handleRemoveArrayItem('rows', idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddArrayItem('rows', '新行')} className="text-blue-500 text-sm flex items-center mt-2 hover:underline">
                  <Plus className="w-4 h-4 mr-1" /> 添加行
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">列选项 (Cols)</label>
              <div className="space-y-2">
                {(props.cols || []).map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={col}
                      onChange={(e) => handleArrayChange('cols', idx, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button type="button" onClick={() => handleRemoveArrayItem('cols', idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddArrayItem('cols', '新列')} className="text-blue-500 text-sm flex items-center mt-2 hover:underline">
                  <Plus className="w-4 h-4 mr-1" /> 添加列
                </button>
              </div>
            </div>
          </>
        )}

        {/* Layout */}
        {['radio', 'checkbox', 'blank'].includes(type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排列方式</label>
            <select 
              value={props.layout} 
              onChange={(e) => handleChange('layout', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {type === 'blank' ? (
                <>
                  <option value="vertical">上下排列</option>
                  <option value="horizontal">左右排列</option>
                </>
              ) : (
                <>
                  <option value="vertical">纵向排列</option>
                  <option value="horizontal">横向排列</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* Checkbox Limits */}
        {type === 'checkbox' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最少选择</label>
              <input 
                type="number" 
                value={props.min} 
                onChange={(e) => handleChange('min', Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最多选择</label>
              <input 
                type="number" 
                value={props.max} 
                onChange={(e) => handleChange('max', Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}

        {/* Rate Props */}
        {type === 'rate' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大分数</label>
              <input 
                type="number" 
                value={props.maxStar} 
                onChange={(e) => handleChange('maxStar', Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分样式</label>
              <select 
                value={props.shape} 
                onChange={(e) => handleChange('shape', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="star">星形</option>
                <option value="number">数字方块</option>
                <option value="slider">滑块</option>
              </select>
            </div>
          </>
        )}

        {/* Upload Props */}
        {type === 'upload' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大文件数</label>
              <input 
                type="number" 
                value={props.maxFiles} 
                onChange={(e) => handleChange('maxFiles', Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单文件大小限制 (MB)</label>
              <input 
                type="number" 
                value={props.maxSize} 
                onChange={(e) => handleChange('maxSize', Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">允许的格式 (如 image/*)</label>
              <input 
                type="text" 
                value={props.accept} 
                onChange={(e) => handleChange('accept', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </>
        )}

        {/* Logic Jump Info */}
        {['radio'].includes(type) && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">条件逻辑与跳转</h4>
            <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              可根据此题的选项选择，决定后续题目的显示或跳转到特定分页。请在问卷预览模式或逻辑设置面板中配置。
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
