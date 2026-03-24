const STORAGE_KEYS = {
  SURVEYS: 'survey_system_surveys',
  REPORTS: 'survey_system_reports',
  USERS: 'survey_system_users',
  TARGETS: 'survey_system_targets'
};

const DataService = {
  init() {
      if (!localStorage.getItem(STORAGE_KEYS.SURVEYS)) {
          localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TARGETS)) {
          localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify([]));
      }
      
      if (!localStorage.getItem(STORAGE_KEYS.USERS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)).length === 0) {
          this.populateMockUsers();
      }

      const surveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS));
      if (surveys.length < 5) { // Check if we need to populate initial data
          this.populateInitialData();
      }
  },

  populateMockUsers() {
      const users = [
          { username: 'admin', name: '系统管理员', role: 'admin' },
          { username: 'director', name: '王主任', role: 'district_director' },
          { username: 'researcher1', name: '李调研员', role: 'district_researcher' },
          { username: 'principal1', name: '赵校长', role: 'principal', school: '市北四实验' },
          { username: 'teacher1', name: '孙老师', role: 'teacher', school: '市北四实验' },
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  populateInitialData() {
    // Populate with comprehensive mock data
    const initialSurveys = [
        {
            id: 'mock_1',
            school: '市北四实验',
            grade: '初二',
            class: '1班',
            subject: '数学',
            teacher: '隋老师',
            observer: '王教研员',
            date: '2026-03-12',
            survey_mode: '集中调研',
            topic: '三角形内角和定理',
            lesson_type: 'new',
            status: 'completed',
            processSteps: [
                { step: '1', type: '情景导入', time: '5', content: '展示不同形状三角形纸片，提问内角和。' },
                { step: '2', type: '新知探究', time: '20', content: '动手撕角拼角，几何画板演示，推理论证（辅助线作法）。' },
                { step: '3', type: '巩固练习', time: '10', content: '基础题求角度，应用题比例计算，五角星模型。' },
                { step: '4', type: '总结归纳', time: '3', content: '总结定理内容、转化思想、逻辑推理方法。' }
            ],
            highlights: '注重过程体验，一题多解，数形结合。',
            problems_suggestions: '板书耗时较长，需加强对后进生的关注。',
            overall_evaluation: '扎实的几何证明课，教会了转化思想。',
            teacher_target: '目标明确，重视证明过程和思想渗透。',
            teacher_content: '层层递进，从感性到理性，重点突出。',
            teacher_method: '启发式、探究式教学，结合多媒体和动手操作。',
            teacher_org: '节奏掌控得当，讲练结合，小组讨论有序。',
            teacher_literacy: '教态自然，板书规范，语言精练。',
            student_participation: '参与度很高，紧跟思路。',
            student_thinking: '思维活跃，积极思考辅助线作法。',
            student_achievement: '大部分学生掌握了证明方法，达成目标。'
        },
        {
            id: 'mock_2',
            school: '市北四实验',
            grade: '初二',
            class: '2班',
            subject: '数学',
            teacher: '毛老师',
            observer: '李调研员',
            date: '2026-03-12',
            survey_mode: '集中调研',
            topic: '图形的旋转',
            lesson_type: 'new',
            status: 'completed',
            processSteps: [
                { step: '1', type: '情景导入', time: '5', content: '视频展示风车、时钟等，引出旋转定义。' },
                { step: '2', type: '新知探究', time: '20', content: '演示旋转过程，明确三要素，探索性质（对应点距离相等）。' },
                { step: '3', type: '巩固练习', time: '12', content: '识别旋转，找要素，作图练习。' },
                { step: '4', type: '总结归纳', time: '3', content: '回顾概念、性质、作图技能。' }
            ],
            highlights: '生活化教学，注重动手实践，作图示范规范。',
            problems_suggestions: '作图是难点，量角器使用需强化。',
            overall_evaluation: '规范扎实的新授课，重点突出。',
            teacher_target: '清晰明确，重点落实旋转概念及作图。',
            teacher_content: '素材生活化，探究设计合理。',
            teacher_method: '讲授与演示结合，作图示范清晰。',
            teacher_org: '秩序良好，过渡自然，个别指导到位。',
            teacher_literacy: '板书工整，作图规范。',
            student_participation: '兴趣浓厚，动手参与度高。',
            student_thinking: '观察分析能力较好。',
            student_achievement: '理解三要素，部分学生方向感需强化。'
        },
        {
            id: 'mock_3',
            school: '市北四实验',
            grade: '初二',
            class: '5班',
            subject: '数学',
            teacher: '李老师',
            observer: '张调研员',
            date: '2026-03-11',
            topic: '平行四边形的判定',
            lesson_type: 'exercise',
            status: 'completed'
        },
        {
            id: 'mock_4',
            school: '市北四实验',
            grade: '初二',
            class: '7班',
            subject: '数学',
            teacher: '任老师',
            observer: '王教研员',
            date: '2026-03-10',
            topic: '全等三角形复习',
            lesson_type: 'review',
            status: 'completed'
        },
        {
            id: 'mock_5',
            school: '市北四实验',
            grade: '初二',
            class: '9班',
            subject: '数学',
            teacher: '邵老师',
            observer: '赵校长',
            date: '2026-03-09',
            topic: '一次函数',
            lesson_type: 'new',
            status: 'completed'
        },
        {
            id: 'mock_6',
            school: '市北四实验',
            grade: '初二',
            class: '11班',
            subject: '数学',
            teacher: '吕老师',
            observer: '孙老师',
            date: '2026-03-08',
            topic: '数据的收集与整理',
            lesson_type: 'experiment',
            status: 'completed'
        },
        {
            id: 'mock_7',
            school: '市北四实验',
            grade: '初二',
            class: '13班',
            subject: '数学',
            teacher: '李老师',
            observer: '王教研员',
            date: '2026-03-05',
            topic: '勾股定理',
            lesson_type: 'new',
            status: 'completed'
        },
        {
            id: 'mock_8',
            school: '市北四实验',
            grade: '初二',
            class: '1班',
            subject: '英语',
            teacher: '张老师',
            observer: '李调研员',
            date: '2026-03-04',
            topic: 'Unit 3 Reading',
            lesson_type: 'new',
            status: 'completed'
        },
        {
            id: 'mock_9',
            school: '市北四实验',
            grade: '初二',
            class: '3班',
            subject: '物理',
            teacher: '王老师',
            observer: '赵校长',
            date: '2026-03-03',
            topic: '力的作用',
            lesson_type: 'experiment',
            status: 'completed'
        }
    ];
    
    // Force update for demo purposes if survey count is low
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
    if (current.length < 5) {
        localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(initialSurveys));
    }
  },

  getSurveys(filters = {}) {
      let surveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
      
      if (filters.school) surveys = surveys.filter(s => s.school === filters.school);
      if (filters.subject) surveys = surveys.filter(s => s.subject === filters.subject);
      if (filters.observer) surveys = surveys.filter(s => s.observer === filters.observer);
      
      // Time Span Filter
      if (filters.timeSpan && filters.timeSpan !== 'all') {
          const now = new Date();
          let startDate = new Date();
          
          switch (filters.timeSpan) {
              case 'week':
                  startDate.setDate(now.getDate() - 7);
                  break;
              case 'month':
                  startDate.setDate(now.getDate() - 30);
                  break;
              case 'three_months':
                  startDate.setMonth(now.getMonth() - 3);
                  break;
              case 'semester': // Approx 6 months
                  startDate.setMonth(now.getMonth() - 6);
                  break;
              case 'year':
                  startDate.setFullYear(now.getFullYear() - 1);
                  break;
              case 'three_years':
                  startDate.setFullYear(now.getFullYear() - 3);
                  break;
              default:
                  break;
          }

          surveys = surveys.filter(s => {
              if (!s.date) return false;
              const surveyDate = new Date(s.date);
              return surveyDate >= startDate;
          });
      }

      return surveys.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getSurveyById(id) {
      const surveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
      return surveys.find(s => s.id === id);
  },

  addSurvey(surveyData) {
      const surveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
      
      // If editing existing survey (check if ID exists and is valid)
      if (surveyData.id) {
          const index = surveys.findIndex(s => s.id === surveyData.id);
          if (index !== -1) {
              surveys[index] = { ...surveys[index], ...surveyData };
              localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
              return surveys[index];
          }
      }

      const newSurvey = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'completed',
          ...surveyData
      };
      surveys.unshift(newSurvey);
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
      return newSurvey;
  },

  deleteSurvey(id) {
      let surveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
      surveys = surveys.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
  },

  // Target Management
  getTargets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TARGETS) || '[]');
  },

  setTarget(targetData) {
    let targets = this.getTargets();
    // Check if target exists for this user/role, update or add
    const index = targets.findIndex(t => t.userId === targetData.userId);
    if (index !== -1) {
      targets[index] = { ...targets[index], ...targetData, updatedAt: new Date().toISOString() };
    } else {
      targets.push({ 
        id: Date.now().toString(), 
        createdAt: new Date().toISOString(), 
        ...targetData 
      });
    }
    localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
  },

  getUsersByRole(role) {
     const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
     return users.filter(u => u.role === role);
  },

  // Stats for Dashboard
  getDashboardStats(filters = {}) {
      // Get filtered surveys for stats
      const surveys = this.getSurveys(filters);
      
      // Get ALL surveys to populate filter dropdowns (unfiltered list)
      const allSurveys = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]');
      const allObservers = [...new Set(allSurveys.map(s => s.observer).filter(Boolean))];
      const allSchools = [...new Set(allSurveys.map(s => s.school).filter(Boolean))];
      const allSubjects = [...new Set(allSurveys.map(s => s.subject).filter(Boolean))];

      const schoolSet = new Set(surveys.map(s => s.school));
      
      const subjectCounts = {};
      surveys.forEach(s => {
          const subj = s.subject || '未分类';
          subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
      });

      const data = Object.keys(subjectCounts).map(key => ({
        name: key,
        count: subjectCounts[key]
      }));

      // Calculate Monthly Stats (Last 6 months)
      const monthlyStats = {
          labels: [],
          data: []
      };
      
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthLabel = `${d.getMonth() + 1}月`;
          monthlyStats.labels.push(monthLabel);
          
          const count = surveys.filter(s => {
              if (!s.date) return false;
              const sDate = new Date(s.date);
              return sDate.getMonth() === d.getMonth() && sDate.getFullYear() === d.getFullYear();
          }).length;
          monthlyStats.data.push(count);
      }

      return {
          schoolCount: schoolSet.size,
          totalSurveys: surveys.length,
          completedSurveys: surveys.filter(s => s.status === 'completed').length,
          coverage: schoolSet.size > 0 ? Math.round((schoolSet.size / 6) * 100) : 0, // Mock total schools = 6
          subjectData: data,
          monthlyStats,
          allObservers,
          allSchools,
          allSubjects
      };
  }
};

export default DataService;
