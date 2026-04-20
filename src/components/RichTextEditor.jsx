import React, { useRef, useEffect, useCallback } from 'react';

const CIRCLE_NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
const circleNumberRegex = /^[①②③④⑤⑥⑦⑧⑨⑩]+\s*/;

/**
 * 富文本编辑器组件
 * - 支持纯文本输入
 * - 支持在文本中内联显示图片（通过【图片N】占位符）
 * - 粘贴时自动转为纯文本
 * - 图片不可编辑，只能整体删除
 * - 支持自动编号（圆圈数字）
 */
const RichTextEditor = ({
  value = '',
  onChange,
  images = [],
  disabled = false,
  className = '',
  rows = 4,
  placeholder = '',
  autoNumber = false
}) => {
  const editorRef = useRef(null);
  const lastValueRef = useRef(value);
  const isComposingRef = useRef(false);

  // 将文本值（含【图片N】占位符）转为 HTML
  const valueToHtml = useCallback((text, imgs) => {
    if (!text) return '<div><br></div>';
    return text.split('\n').map(line => {
      const processed = line.replace(/【图片(\d+)】/g, (match, num) => {
        const idx = parseInt(num, 10) - 1;
        const src = imgs?.[idx];
        if (!src) return match;
        return `<img src="${src}" data-placeholder="${match}" style="max-height:60px;vertical-align:middle;border-radius:4px;margin:0 2px;cursor:default;" contenteditable="false" draggable="false" />`;
      });
      return `<div>${processed || '<br>'}</div>`;
    }).join('');
  }, []);

  // 从编辑器 HTML 提取文本值
  const htmlToValue = useCallback((html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const lines = [];
    const children = Array.from(temp.children);

    if (children.length === 0) {
      let text = html;
      text = text.replace(/<img[^>]*data-placeholder="([^"]*)"[^>]*>/g, '$1');
      text = text.replace(/<img[^>]*>/g, '');
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<\/?[^>]+>/g, '');
      return text;
    }

    children.forEach(child => {
      const clone = child.cloneNode(true);
      clone.querySelectorAll('img').forEach(img => {
        const placeholder = img.getAttribute('data-placeholder') || '【图片】';
        img.replaceWith(document.createTextNode(placeholder));
      });
      let lineText = clone.innerHTML || '';
      lineText = lineText.replace(/<br\s*\/?>/gi, '\n');
      lineText = lineText.replace(/<\/?[^>]+>/g, '');
      lines.push(lineText);
    });

    return lines.join('\n');
  }, []);

  // 外部 value 变化时同步到编辑器（仅在非编辑状态下，避免光标跳动）
  useEffect(() => {
    if (!editorRef.current) return;
    if (document.activeElement === editorRef.current) return;
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    editorRef.current.innerHTML = valueToHtml(value, images);
  }, [value, images, valueToHtml]);

  // images 数组变化时，只更新已有 img 的 src，不重建 HTML
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('img[data-placeholder]').forEach(img => {
      const match = img.getAttribute('data-placeholder')?.match(/【图片(\d+)】/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const src = images?.[idx];
        if (src && img.src !== src) {
          img.src = src;
        }
      }
    });
  }, [images]);

  const syncValue = useCallback(() => {
    if (!editorRef.current || isComposingRef.current) return;
    const newValue = htmlToValue(editorRef.current.innerHTML);
    lastValueRef.current = newValue;
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [htmlToValue, value, onChange]);

  const handleInput = () => {
    syncValue();
  };

  const handleBlur = () => {
    syncValue();
  };

  // 粘贴时强制纯文本
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // 中文输入法 composition 处理
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    syncValue();
  };

  // 自动编号 Enter 处理
  const handleAutoNumberEnter = (e) => {
    e.preventDefault();

    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // 获取当前行（div）
    let currentNode = range.startContainer;
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    const currentDiv = currentNode.closest('div');
    if (!currentDiv || !editor.contains(currentDiv)) return;

    const allDivs = Array.from(editor.children);
    const currentLineIndex = allDivs.indexOf(currentDiv);

    // 获取光标在纯文本中的偏移
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(currentDiv);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretOffset = preCaretRange.toString().length;

    const fullText = currentDiv.innerText;
    const beforeCaret = fullText.slice(0, caretOffset);
    const afterCaret = fullText.slice(caretOffset);

    // 检查是否需要自动编号
    const hasAnyNumber = allDivs.some(d => circleNumberRegex.test(d.innerText || ''));
    const shouldAutoNumber = circleNumberRegex.test(beforeCaret) ||
      (!hasAnyNumber && currentLineIndex === 0 && beforeCaret.trim().length > 0);

    if (!shouldAutoNumber) {
      // 普通换行：拆分行
      currentDiv.innerText = beforeCaret;
      const newDiv = document.createElement('div');
      newDiv.innerText = afterCaret || '\u200B'; // 零宽空格保持空行
      if (currentDiv.nextSibling) {
        editor.insertBefore(newDiv, currentDiv.nextSibling);
      } else {
        editor.appendChild(newDiv);
      }
      // 移动光标到新行开头
      const newRange = document.createRange();
      if (newDiv.firstChild) {
        newRange.setStart(newDiv.firstChild, 0);
        newRange.setEnd(newDiv.firstChild, 0);
      } else {
        newRange.selectNodeContents(newDiv);
        newRange.collapse(true);
      }
      selection.removeAllRanges();
      selection.addRange(newRange);
      syncValue();
      return;
    }

    // 给当前行加编号
    const lineNum = CIRCLE_NUMBERS[currentLineIndex];
    if (lineNum && !circleNumberRegex.test(beforeCaret)) {
      currentDiv.innerText = `${lineNum} ${beforeCaret}`;
    } else if (lineNum) {
      currentDiv.innerText = beforeCaret.replace(circleNumberRegex, `${lineNum} `);
    } else {
      currentDiv.innerText = beforeCaret;
    }

    // 创建新行
    const newLineNum = CIRCLE_NUMBERS[currentLineIndex + 1];
    const newDiv = document.createElement('div');
    newDiv.innerText = newLineNum ? `${newLineNum} ${afterCaret}` : afterCaret;

    if (currentDiv.nextSibling) {
      editor.insertBefore(newDiv, currentDiv.nextSibling);
    } else {
      editor.appendChild(newDiv);
    }

    // 重新编号后续行
    const updatedDivs = Array.from(editor.children);
    for (let i = currentLineIndex + 2; i < updatedDivs.length; i++) {
      const div = updatedDivs[i];
      const text = div.innerText || '';
      if (!text.trim()) continue;
      const num = CIRCLE_NUMBERS[i];
      if (!num) continue;
      if (circleNumberRegex.test(text)) {
        div.innerText = text.replace(circleNumberRegex, `${num} `);
      }
    }

    // 移动光标到新行编号后
    const newRange = document.createRange();
    const prefixLen = newLineNum ? newLineNum.length + 1 : 0;
    if (newDiv.firstChild) {
      newRange.setStart(newDiv.firstChild, prefixLen);
      newRange.setEnd(newDiv.firstChild, prefixLen);
    } else {
      newRange.selectNodeContents(newDiv);
      newRange.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(newRange);

    syncValue();
  };

  // 处理按键
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (autoNumber && !disabled) {
        handleAutoNumberEnter(e);
      } else {
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br><br>');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.collapse(false);
        }
      }
    }
  };

  return (
    <>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        className={`block w-full sm:text-sm border rounded-md p-2 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'} ${className}`}
        style={{
          minHeight: `${rows * 24}px`,
          maxHeight: `${rows * 36}px`,
          lineHeight: '1.5'
        }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </>
  );
};

export default RichTextEditor;
