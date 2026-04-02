import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export default function RichTextEditor({ value, onChange, disabled, placeholder }) {
  const editorRef = useRef(null);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current.focus();
    handleInput();
  };

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${disabled ? 'bg-gray-100 opacity-70' : 'bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500'}`}>
      {!disabled && (
        <div className="bg-gray-50 border-b border-gray-200 p-1 flex flex-wrap gap-1 items-center">
          <button type="button" onClick={() => execCommand('bold')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="加粗"><Bold size={16} /></button>
          <button type="button" onClick={() => execCommand('italic')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="斜体"><Italic size={16} /></button>
          <button type="button" onClick={() => execCommand('underline')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="下划线"><Underline size={16} /></button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button type="button" onClick={() => execCommand('fontSize', '4')} className="px-2 py-0.5 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="大字号">大</button>
          <button type="button" onClick={() => execCommand('fontSize', '3')} className="px-2 py-0.5 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="中字号">中</button>
          <button type="button" onClick={() => execCommand('fontSize', '2')} className="px-2 py-0.5 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium" title="小字号">小</button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button type="button" onClick={() => execCommand('justifyLeft')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="左对齐"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => execCommand('justifyCenter')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="居中"><AlignCenter size={16} /></button>
          <button type="button" onClick={() => execCommand('justifyRight')} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="右对齐"><AlignRight size={16} /></button>
        </div>
      )}
      <div 
        ref={editorRef}
        className={`p-3 min-h-[60px] outline-none text-sm ${disabled ? 'cursor-not-allowed text-gray-600' : 'text-gray-900'}`}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={handleInput}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block; /* For Firefox */
        }
      `}} />
    </div>
  );
}
