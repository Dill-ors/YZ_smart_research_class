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

export const exportReport = async (surveyData, responses = [], targetUsers = [], format = 'word') => {
  const { title, description, pages, autoNumbering = true } = surveyData || {};
  const questions = pages ? pages.flat() : [];
  const latestResponses = responses;

  try {
    let htmlContent = `
      <div style="padding: 20px; font-family: SimSun, 'Times New Roman', serif; color: #000; line-height: 1.6; font-size: 12pt; max-width: 800px; margin: 0 auto; background-color: #fff;">
      <h1 style="text-align: center; font-size: 20pt; margin-bottom: 20px; font-weight: bold;">${title || '未命名问卷'} 调研报告</h1>
      ${description ? `<p style="margin-bottom: 20px; font-size: 12pt; color: #666;">${description}</p>` : ''}
      <p style="margin-bottom: 30px; font-size: 14pt;"><strong>填写总人数：</strong> ${latestResponses.length} 人</p>
    `;

  // 1. Process normal questions
    const normalQuestions = questions.filter(q => q.type !== 'lesson_record' && q.type !== 'pagination');
    if (normalQuestions.length > 0) {
      htmlContent += `<div style="margin-bottom: 40px;">`;

      // 编号状态跟踪 - 只在 autoNumbering 为 true 时启用
      const numbering = { h2: 0, h3: 0, h4: 0 };

      normalQuestions.forEach((q) => {
        // 获取组件的 level
        const level = q.level || (q.type === 'title' ? (q.titleLevel || 'h1') : 'none');

        // 计算显示编号 - 只在 autoNumbering 为 true 时生成编号
        let displayNumber = '';
        if (autoNumbering && level !== 'none') {
          if (level === 'h2') {
            numbering.h2++;
            numbering.h3 = 0;
            numbering.h4 = 0;
            displayNumber = `${toChineseNumber(numbering.h2)}、`;
          } else if (level === 'h3') {
            numbering.h3++;
            numbering.h4 = 0;
            displayNumber = `${numbering.h3}. `;
          } else if (level === 'h4') {
            numbering.h4++;
            displayNumber = `${numbering.h3}.${numbering.h4} `;
          }
        }
        
        if (q.type === 'title') {
           // title 类型组件根据 level 显示编号
           const titleLevel = q.titleLevel || 'h1';
           let fontSize = '20pt';
           if (titleLevel === 'h2') fontSize = '18pt';
           if (titleLevel === 'h3') fontSize = '16pt';
           if (titleLevel === 'h4') fontSize = '14pt';
           
           htmlContent += `
             <div style="margin-bottom: 20px; text-align: ${q.align || 'center'};">
               <h1 style="font-size: ${fontSize}; font-weight: bold; margin-bottom: 10px;">${displayNumber}${q.label || q.title || '未命名标题'}</h1>
               ${q.description ? `<p style="color: #666; font-size: 12pt;">${q.description}</p>` : ''}
             </div>
           `;
           return;
        }
        
        if (q.type === 'text') {
           htmlContent += `
             <div style="margin-bottom: 20px;">
               ${q.label ? `<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">${displayNumber}${q.label}</h3>` : ''}
               <div style="font-size: 12pt; line-height: 1.6; color: #333;">${q.content || ''}</div>
             </div>
           `;
           return;
        }

        let headerHtml = '';
        if (q.type === 'blank' || q.type === 'matrix') {
          const displayTitle = q.label || q.title;
          if (displayTitle && displayTitle.trim()) {
            headerHtml = `<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">${displayNumber}${displayTitle}</h3>`;
          }
        } else {
          const displayTitle = q.label || q.title || '未命名题目';
          headerHtml = `<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">${displayNumber}${displayTitle}</h3>`;
        }

        htmlContent += `
          <div style="margin-bottom: 20px;">
            ${headerHtml}
        `;
        
        // Render answers summary
        if (q.type === 'radio' || q.type === 'checkbox') {
        const counts = {};
        let total = 0;
        latestResponses.forEach(r => {
          const ans = r.answers?.[q.id];
          if (Array.isArray(ans)) {
            ans.forEach(a => { counts[a] = (counts[a] || 0) + 1; total++; });
          } else if (ans) {
            counts[ans] = (counts[ans] || 0) + 1; total++;
          }
        });
        q.options && q.options.forEach(opt => {
          const count = counts[opt] || 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          htmlContent += `<p style="margin: 5px 0 5px 20px;">${opt}: ${count}人 (${percent}%)</p>`;
        });
      } else if (q.type === 'matrix') {
        // matrix answers
        const columns = q.cols || q.columns || [];
        const baseRows = q.rows || [];
        
        let allRows = [...baseRows];
        latestResponses.forEach(r => {
           const ans = r.answers?.[q.id];
           if (ans && Array.isArray(ans.addedRows)) {
             ans.addedRows.forEach(ar => {
                if (!allRows.includes(ar)) allRows.push(ar);
             });
           }
        });

        htmlContent += `<table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>${q.topLeftLabel || '项目'}</th>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
        `;
        allRows.forEach(row => {
          htmlContent += `<tr><td>${row}</td>`;
          columns.forEach((col, cIdx) => {
             const cellKey = `${row}_${cIdx}`;
             if (q.mode === 'input') {
               let texts = [];
               latestResponses.forEach(r => {
                  const ans = r.answers?.[q.id];
                  if (ans && ans.cells && ans.cells[cellKey]) {
                     texts.push(ans.cells[cellKey]);
                  }
               });
               htmlContent += `<td style="text-align: left; vertical-align: top;">${texts.join('<br/>')}</td>`;
             } else {
               let count = 0;
               latestResponses.forEach(r => {
                  const ans = r.answers?.[q.id];
                  if (ans && ans.cells && ans.cells[cellKey] === true) count++;
               });
               htmlContent += `<td style="text-align: center;">${count}</td>`;
             }
          });
          htmlContent += `</tr>`;
        });
        htmlContent += `</tbody></table>`;

      } else if (q.type === 'blank') {
        // Blank answers
        const textAnswers = [];
        latestResponses.forEach(r => {
           let a = r.answers?.[q.id];
           if (Array.isArray(a)) {
              a.forEach(item => {
                 if (item && String(item).trim()) textAnswers.push(item);
              });
           } else if (a && String(a).trim()) {
              textAnswers.push(a);
           }
        });
        
        if (textAnswers.length > 0) {
          htmlContent += `<ul style="margin: 10px 0 10px 20px; padding-left: 20px;">`;
          textAnswers.forEach(ans => { 
            htmlContent += `<li style="margin-bottom: 5px;">${String(ans).replace(/\n/g, '<br/>')}</li>`;
          });
          htmlContent += `</ul>`;
        } else {
           htmlContent += `<p style="color: #666; margin-left: 20px;">暂无回答</p>`;
        }
      } else if (q.type === 'rate') {
        let totalScore = 0;
        let count = 0;
        latestResponses.forEach(r => {
          const ans = r.answers?.[q.id];
          if (ans !== undefined && ans !== null) {
            totalScore += Number(ans);
            count++;
          }
        });
        const avgScore = count > 0 ? (totalScore / count).toFixed(1) : 0;
        const maxStar = q.maxStar || 5;
        
        htmlContent += `<p style="margin: 5px 0 5px 20px;"><strong>平均评分：</strong> ${avgScore} / ${maxStar} （共 ${count} 人参与评分）</p>`;
      } else if (q.type === 'upload') {
        htmlContent += `<div style="margin: 5px 0 5px 20px;">`;
        let hasFiles = false;
        latestResponses.forEach(r => {
            const ans = r.answers?.[q.id];
            if (Array.isArray(ans) && ans.length > 0) {
                hasFiles = true;
                htmlContent += `<p style="margin: 5px 0; color: #666;">用户 <strong>${r.userName || '匿名'}</strong> 上传的文件：</p>`;
                htmlContent += `<div style="margin-bottom: 10px;">`;
                ans.forEach(file => {
                    if (file.type && file.type.startsWith('image/')) {
                        htmlContent += `<img src="${file.url}" alt="${file.name}" style="max-width: 200px; max-height: 200px; object-fit: contain; border: 1px solid #ccc; padding: 2px; margin-right: 10px; margin-bottom: 10px;" />`;
                    } else {
                        htmlContent += `<div style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-size: 10pt; display: inline-block; margin-right: 10px; margin-bottom: 10px;">📎 ${file.name}</div>`;
                    }
                });
                htmlContent += `</div>`;
            }
        });
        if (!hasFiles) {
            htmlContent += `<p style="color: #666;">暂无上传文件</p>`;
        }
        htmlContent += `</div>`;
      } else if (q.type === 'sort') {
        const options = q.options || [];
        const rankScores = {};
        options.forEach(opt => { rankScores[opt] = 0; });
        
        let count = 0;
        latestResponses.forEach(r => {
          const ans = r.answers?.[q.id];
          if (Array.isArray(ans) && ans.length > 0) {
            count++;
            const n = ans.length;
            ans.forEach((opt, idx) => {
              if (rankScores[opt] !== undefined) {
                rankScores[opt] += (n - idx);
              }
            });
          }
        });
        
        if (count > 0) {
          const sortedOptions = Object.keys(rankScores).sort((a, b) => rankScores[b] - rankScores[a]);
          htmlContent += `<p style="margin: 10px 0 5px 20px; font-weight: bold;">综合排序结果（共 ${count} 人参与）：</p>`;
          htmlContent += `<ol style="margin: 5px 0 10px 20px; padding-left: 20px;">`;
          sortedOptions.forEach(opt => {
            htmlContent += `<li style="margin-bottom: 5px;">${opt} <span style="color: #666; font-size: 10pt;">(得分: ${rankScores[opt]})</span></li>`;
          });
          htmlContent += `</ol>`;
        } else {
          htmlContent += `<p style="color: #666; margin-left: 20px;">暂无回答</p>`;
        }
      } else {
        // Text answers
        const textAnswers = latestResponses.map(r => {
           let a = r.answers?.[q.id];
           if (Array.isArray(a)) {
              return a.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ');
           }
           return a;
        }).filter(a => a);
        
        if (textAnswers.length > 0) {
          htmlContent += `<ul style="margin: 10px 0 10px 20px; padding-left: 20px;">`;
          textAnswers.slice(0, 20).forEach(ans => {
            htmlContent += `<li style="margin-bottom: 5px;">${ans}</li>`;
          });
          if (textAnswers.length > 20) {
            htmlContent += `<li style="color: #666; font-style: italic;">...等共 ${textAnswers.length} 条回答</li>`;
          }
          htmlContent += `</ul>`;
        } else {
           htmlContent += `<p style="color: #666; margin-left: 20px;">暂无回答</p>`;
        }
      }
      htmlContent += `</div>`;
    });
    htmlContent += `</div>`;
  }

  // 2. Process lesson records
  const lessonRecordQuestions = questions.filter(q => q.type === 'lesson_record');
  if (lessonRecordQuestions.length > 0) {
    let allRecords = [];
    lessonRecordQuestions.forEach(q => {
      latestResponses.forEach(r => {
        const records = r.answers?.[q.id];
        if (Array.isArray(records)) {
          allRecords.push(...records.filter(rec => typeof rec === 'object'));
        }
      });
    });

    if (allRecords.length > 0) {
      htmlContent += `
        <div style="margin-top: 40px;">
          <h2 style="font-size: 18pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">听课记录汇总</h2>
      `;

      const groupedBySubject = allRecords.reduce((acc, rec) => {
        const subject = rec.subject || '其他学科';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(rec);
        return acc;
      }, {});

      const subjectNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
      
      Object.keys(groupedBySubject).forEach((subject, sIdx) => {
        const subjectNum = subjectNumbers[sIdx] || (sIdx + 1);
        htmlContent += `
          <h3 style="font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 15px;">（${subjectNum}）${subject}</h3>
        `;

        const records = groupedBySubject[subject];
        let allSchoolSuggestions = [];

        records.forEach((rec, rIdx) => {
          const period = rec.period ? `第${rec.period}节` : '未知节次';
          const grade = rec.grade || '';
          const topic = rec.topic || '无课题';
          const teacher = rec.teacher || '未知教师';
          
          htmlContent += `
            <div style="margin-bottom: 15px; padding-left: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px; font-size: 14pt;">
                ${rIdx + 1}.${period}：${grade} 课题《${topic}》 执教教师：${teacher}
              </p>
          `;

          if (rec.highlights) {
            htmlContent += `<p style="margin: 5px 0 5px 20px;"><strong>（1）主要优点：</strong><br/>${String(rec.highlights).replace(/\n/g, '<br/>')}</p>`;
          }
          if (rec.problems_suggestions) {
            htmlContent += `<p style="margin: 5px 0 5px 20px;"><strong>（2）存在问题：</strong><br/>${String(rec.problems_suggestions).replace(/\n/g, '<br/>')}</p>`;
          }
          
          if (rec.school_suggestions) {
             allSchoolSuggestions.push(rec.school_suggestions);
          }
          
          htmlContent += `</div>`;
        });

        if (allSchoolSuggestions.length > 0) {
          htmlContent += `
            <div style="margin-bottom: 25px; padding-left: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px; font-size: 14pt;">
                ${records.length + 1}.给学校的意见建议：
              </p>
          `;
          const uniqueSuggestions = [...new Set(allSchoolSuggestions)];
          uniqueSuggestions.forEach(sug => {
            htmlContent += `<p style="margin: 5px 0 5px 20px;">${String(sug).replace(/\n/g, '<br/>')}</p>`;
          });
          htmlContent += `</div>`;
        }
      });
      htmlContent += `</div>`;
    }
  }

  htmlContent += `</div>`;

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>`;
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;
  
  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = url;
  fileDownload.download = `${title || '调研报告'}.doc`;
  fileDownload.click();
  
  setTimeout(() => {
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  }, 100);

  } catch (error) {
    console.error('Export error:', error);
    alert('导出失败: ' + error.message);
  }
};
