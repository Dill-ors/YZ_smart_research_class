import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check, ChevronRight } from 'lucide-react';

function normalizeSchools(schools) {
  if (!Array.isArray(schools)) return [];
  return schools.map(s => {
    if (typeof s === 'string') {
      return { id: s, name: s, type: '其他' };
    }
    return {
      id: s.id || s.name || String(Math.random()),
      name: s.name || s.id || '未命名',
      type: s.type || '其他'
    };
  });
}

export default function SchoolSelector({
  schools = [],
  value,
  onChange,
  placeholder = '所有学校',
  className = '',
  disabled = false,
  showAllOption = true,
  icon = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const containerRef = useRef(null);

  const normalizedSchools = useMemo(() => normalizeSchools(schools), [schools]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset expanded groups when dropdown opens/closes or search changes
  useEffect(() => {
    if (!isOpen) {
      setExpandedGroups({});
    } else if (searchQuery.trim()) {
      // When searching, auto-expand all groups
      const allExpanded = {};
      groupedSchools.sortedKeys.forEach(key => {
        allExpanded[key] = true;
      });
      setExpandedGroups(allExpanded);
    }
  }, [isOpen, searchQuery]);

  const groupedSchools = useMemo(() => {
    const filtered = searchQuery.trim()
      ? normalizedSchools.filter(s => s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : normalizedSchools;

    const groups = {};
    filtered.forEach(s => {
      const type = s.type || '其他';
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    });

    // Sort each group by name (pinyin for Chinese)
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    });

    // Sort group keys: 小学, 初中, 高中, 九年一贯制, 十二年一贯制, 其他
    const typeOrder = ['小学', '初中', '高中', '九年一贯制', '十二年一贯制'];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const idxA = typeOrder.indexOf(a);
      const idxB = typeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'zh-CN');
    });

    return { groups, sortedKeys };
  }, [normalizedSchools, searchQuery]);

  const selectedSchool = normalizedSchools.find(s => s.name === value || s.id === value);
  const displayLabel = value && selectedSchool ? selectedSchool.name : placeholder;

  const handleSelect = (schoolName) => {
    onChange(schoolName);
    setIsOpen(false);
    setSearchQuery('');
    setExpandedGroups({});
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchQuery('');
    setExpandedGroups({});
  };

  const toggleGroup = (type) => {
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          icon ? 'pl-10 pr-3' : 'px-3'
        } ${
          disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-white cursor-pointer'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayLabel}
        </span>
        <div className="flex items-center ml-2 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索学校..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {showAllOption && !searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${!value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                <span>所有学校</span>
                {!value && <Check className="w-4 h-4" />}
              </button>
            )}
            {groupedSchools.sortedKeys.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">未找到匹配的学校</div>
            ) : (
              groupedSchools.sortedKeys.map(type => (
                <div key={type}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(type)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-t border-gray-100 first:border-t-0 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <span>{type}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedGroups[type] ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedGroups[type] && groupedSchools.groups[type].map(school => (
                    <button
                      type="button"
                      key={school.id}
                      onClick={() => handleSelect(school.name)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                        value === school.name ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate">{school.name}</span>
                      {value === school.name && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
