const getApiBase = () => {
  // Use proxy path to avoid hardcoded ports and CORS issues
  return `/api`;
};

const DataService = {
  async init() {
    try {
      const users = await this.getAllUsers();
      if (users.length === 0) {
        await this.populateMockUsers();
      }

      const surveys = await this._getAllSurveysRaw();
      if (surveys.length < 5) {
        await this.populateInitialData();
      }

      const reports = await this.getReports();
      if (reports.length === 0) {
        await this.populateInitialReports();
      }
    } catch (e) {
      console.error("Failed to initialize data from server", e);
    }
  },

  async populateInitialReports() {
    const mockReports = [
      { id: 'r1', title: '2026春季全区教学进度调研报告', status: 'published', created_at: '2026-03-01', response_count: 120, category: '教学管理' },
      { id: 'r2', title: '青岛五十三中教师满意度调查', status: 'draft', created_at: '2026-03-15', response_count: 0, category: '人力资源' },
      { id: 'r3', title: '各校实验课开设情况抽查', status: 'closed', created_at: '2026-02-20', response_count: 450, category: '教研抽查' },
      { id: 'r4', title: '学生课后作业负担问卷', status: 'recalled', created_at: '2026-03-18', response_count: 12, category: '教学管理' }
    ];
    for (const r of mockReports) {
      await this.saveReport(r);
    }
  },

  async populateMockUsers() {
    const mockUsers = [
        { id: 'u1', username: 'admin', password: '123', name: '系统管理员', role: 'admin' },
        { id: 'u2', username: 'director', password: '123', name: '王主任', role: 'district_director' },
        { id: 'u3', username: 'researcher1', password: '123', name: '李调研员', role: 'district_researcher' },
        { id: 'u4', username: 'principal1', password: '123', name: '赵校长', role: 'principal', school: '市北四实验' },
        { id: 'u5', username: 'teacher1', password: '123', name: '孙老师', role: 'teacher', subject: '数学', school: '市北四实验' },
        { id: 'u6', username: 'teacher2', password: '123', name: '张老师', role: 'teacher', subject: '物理', school: '市北四实验' },
    ];
    for (const u of mockUsers) {
      await this.addUser(u);
    }
  },

  async getAllUsers() {
    try {
      const url = `${getApiBase()}/users`;
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Fetch users error:', e);
      return [];
    }
  },

  async addUser(userData) {
    const newUser = { id: userData.id || Date.now().toString(), ...userData };
    await fetch(`${getApiBase()}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });
    return newUser;
  },

  async updateUser(id, userData) {
    const users = await this.getAllUsers();
    const existing = users.find(u => u.id === id || u.id === Number(id));
    if (existing) {
        const updated = { ...existing, ...userData };
        await fetch(`${getApiBase()}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        return updated;
    }
    return null;
  },

  async deleteUser(id) {
    await fetch(`${getApiBase()}/users/${id}`, { method: 'DELETE' });
  },

  async populateInitialData() {
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
        { id: 'mock_3', school: '市北四实验', grade: '初二', class: '5班', subject: '数学', teacher: '李老师', observer: '张调研员', date: '2026-03-11', topic: '平行四边形的判定', lesson_type: 'exercise', status: 'completed' },
        { id: 'mock_4', school: '市北四实验', grade: '初二', class: '7班', subject: '数学', teacher: '任老师', observer: '王教研员', date: '2026-03-10', topic: '全等三角形复习', lesson_type: 'review', status: 'completed' },
        { id: 'mock_5', school: '市北四实验', grade: '初二', class: '9班', subject: '数学', teacher: '邵老师', observer: '赵校长', date: '2026-03-09', topic: '一次函数', lesson_type: 'new', status: 'completed' },
        { id: 'mock_6', school: '市北四实验', grade: '初二', class: '11班', subject: '数学', teacher: '吕老师', observer: '孙老师', date: '2026-03-08', topic: '数据的收集与整理', lesson_type: 'experiment', status: 'completed' },
        { id: 'mock_7', school: '市北四实验', grade: '初二', class: '13班', subject: '数学', teacher: '李老师', observer: '王教研员', date: '2026-03-05', topic: '勾股定理', lesson_type: 'new', status: 'completed' },
        { id: 'mock_8', school: '市北四实验', grade: '初二', class: '1班', subject: '英语', teacher: '张老师', observer: '李调研员', date: '2026-03-04', topic: 'Unit 3 Reading', lesson_type: 'new', status: 'completed' },
        { id: 'mock_9', school: '市北四实验', grade: '初二', class: '3班', subject: '物理', teacher: '王老师', observer: '赵校长', date: '2026-03-03', topic: '力的作用', lesson_type: 'experiment', status: 'completed' }
    ];
    for (const s of initialSurveys) {
      await this.addSurvey(s);
    }
  },

  async _getAllSurveysRaw() {
    try {
      const res = await fetch(`${getApiBase()}/surveys`);
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getSurveys(filters = {}) {
        let surveys = await this._getAllSurveysRaw();
        let groups = [];
        if (DataService.getUserGroups) {
           groups = await DataService.getUserGroups();
        }
        
        if (filters.currentUser && (filters.currentUser.role === 'teacher' || filters.currentUser.role === 'district_researcher')) {
            surveys = surveys.filter(s => {
                // If it's explicitly assigned to them
                if (s.publishConfig && s.publishConfig.target) {
                    const target = s.publishConfig.target;
                    if (target.type === 'all') return true;
                    
                    const roleMap = {
                      'teacher': '教师',
                      'district_researcher': '区调研员'
                    };
                    const roleName = roleMap[filters.currentUser.role];

                    if (target.type === 'role' && target.roles && target.roles.includes(roleName)) return true;
                    if (target.type === 'school' && target.schools && target.schools.includes(filters.currentUser.school)) return true;
                    if (target.type === 'user' && target.userIds && target.userIds.includes(filters.currentUser.id)) return true;
                    if (target.type === 'group' && target.groupIds) {
                        const userGroups = groups.filter(g => target.groupIds.includes(g.id) && g.members && g.members.includes(filters.currentUser.id));
                        if (userGroups.length > 0) return true;
                    }
                }
                
                // Also if they are the observer, they can see it (in case they somehow created it or are marked as observer)
                if (s.observer === filters.currentUser.name) return true;
                
                return false;
            });
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            surveys = surveys.filter(s => 
                (s.school && s.school.toLowerCase().includes(search)) ||
                (s.teacher && s.teacher.toLowerCase().includes(search)) ||
                (s.subject && s.subject.toLowerCase().includes(search)) ||
                (s.observer && s.observer.toLowerCase().includes(search))
            );
        }

        if (filters.school && filters.school !== 'ALL') surveys = surveys.filter(s => s.school === filters.school);
        if (filters.subject && filters.subject !== 'ALL') surveys = surveys.filter(s => s.subject === filters.subject);
        if (filters.observer && filters.observer !== 'ALL') surveys = surveys.filter(s => s.observer === filters.observer);
        if (filters.lesson_type && filters.lesson_type !== 'ALL') surveys = surveys.filter(s => s.lesson_type === filters.lesson_type);
        if (filters.survey_mode && filters.survey_mode !== 'ALL') surveys = surveys.filter(s => s.survey_mode === filters.survey_mode);
        
        if (filters.timeSpan && filters.timeSpan !== 'all') {
          const now = new Date();
          let startDate = new Date();
          
          switch (filters.timeSpan) {
              case 'week': startDate.setDate(now.getDate() - 7); break;
              case 'month': startDate.setDate(now.getDate() - 30); break;
              case 'three_months': startDate.setMonth(now.getMonth() - 3); break;
              case 'semester': startDate.setMonth(now.getMonth() - 6); break;
              case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
              case 'three_years': startDate.setFullYear(now.getFullYear() - 3); break;
              default: break;
          }

          surveys = surveys.filter(s => {
              if (!s.date) return false;
              const surveyDate = new Date(s.date);
              return surveyDate >= startDate;
          });
      }

      return surveys.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getSurveyById(id) {
      const surveys = await this._getAllSurveysRaw();
      return surveys.find(s => s.id === id);
  },

  async addSurvey(surveyData) {
      const newSurvey = {
          id: surveyData.id || Date.now().toString(),
          createdAt: surveyData.createdAt || new Date().toISOString(),
          status: surveyData.status || 'completed',
          ...surveyData
      };
      await fetch(`${getApiBase()}/surveys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSurvey)
      });
      return newSurvey;
  },

  async deleteSurvey(id) {
      await fetch(`${getApiBase()}/surveys/${id}`, { method: 'DELETE' });
  },

  async getReports(filters = {}) {
    try {
      const res = await fetch(`${getApiBase()}/reports?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      let reports = await res.json();
      
      let groups = [];
      if (DataService.getUserGroups) {
          groups = await DataService.getUserGroups();
      }

      if (filters.currentUser && (filters.currentUser.role === 'teacher' || filters.currentUser.role === 'district_researcher')) {
          reports = reports.filter(r => {
              if (r.publishConfig && r.publishConfig.target) {
                  const target = r.publishConfig.target;
                  if (target.type === 'all') return true;
                  
                  const roleMap = {
                    'teacher': '教师',
                    'district_researcher': '区调研员'
                  };
                  const roleName = roleMap[filters.currentUser.role];

                  if (target.type === 'role' && target.roles && target.roles.includes(roleName)) return true;
                  if (target.type === 'school' && target.schools && target.schools.includes(filters.currentUser.school)) return true;
                  if (target.type === 'user' && target.userIds && target.userIds.includes(filters.currentUser.id)) return true;
                  if (target.type === 'group' && target.groupIds) {
                      const userGroups = groups.filter(g => target.groupIds.includes(g.id) && g.members && g.members.includes(filters.currentUser.id));
                      if (userGroups.length > 0) return true;
                  }
              }
              return false;
          });
      }
      return reports;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveReport(reportData) {
    if (!reportData.id) {
        reportData.id = Date.now().toString();
    }
    await fetch(`${getApiBase()}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    });
    return reportData;
  },

  async deleteReport(id) {
    await fetch(`${getApiBase()}/reports/${id}`, { method: 'DELETE' });
  },

  async getResponses() {
    try {
      const res = await fetch(`${getApiBase()}/responses?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async addResponse(responseData) {
    if (!responseData.id) {
        responseData.id = Date.now().toString();
    }
    await fetch(`${getApiBase()}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
    });
    return responseData;
  },

  async restoreData(data) {
    const res = await fetch(`${getApiBase()}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error('Restore failed');
    }
    return res.json();
  },

  async getTargets() {
    try {
      const res = await fetch(`${getApiBase()}/targets`);
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async deleteTarget(id) {
    try {
      await fetch(`${getApiBase()}/targets/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting target:', e);
      throw e;
    }
  },

  async getResearcherProgress() {
      const users = await this.getAllUsers();
      const researchers = users.filter(u => u.role === 'district_researcher');
      const targets = await this.getTargets();
      const surveys = await this._getAllSurveysRaw();

      const progressData = researchers.map(researcher => {
          const userTarget = targets.find(t => t.userId === researcher.username) || { targetValue: 0 };
          const userSurveys = surveys.filter(s => s.researcherName === researcher.name || s.observer === researcher.name);
          
          // Calculate monthly counts
          const monthlyCounts = {};
          userSurveys.forEach(s => {
              if (s.date) {
                  const month = s.date.substring(0, 7); // YYYY-MM
                  monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
              }
          });

          return {
              id: researcher.id,
              name: researcher.name,
              subject: researcher.subject || '全科',
              target: userTarget.targetValue,
              completed: userSurveys.length,
              monthlyCounts
          };
      });

      return progressData;
  },

  async setTarget(targetData) {
    const targets = await this.getTargets();
    const existing = targets.find(t => t.userId === targetData.userId);
    const dataToSave = existing 
        ? { ...existing, ...targetData, updatedAt: new Date().toISOString() }
        : { id: Date.now().toString(), createdAt: new Date().toISOString(), ...targetData };
    
    await fetch(`${getApiBase()}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
    });
  },

  async getUsersByRole(role) {
     const users = await this.getAllUsers();
     return users.filter(u => u.role === role);
  },

  async getDashboardStats(filters = {}) {
      // Remove currentUser from filters to get global stats for managers
      const isManager = filters.currentUser && ['admin', 'district_director', 'principal'].includes(filters.currentUser.role);
      
      const statsFilters = { ...filters };
      if (isManager) {
          delete statsFilters.currentUser; // Managers see all data
      }

      // If subject is ALL, we shouldn't filter by subject
      if (statsFilters.subject === 'ALL') {
          delete statsFilters.subject;
      }

      const surveys = await this.getSurveys(statsFilters);
      const accessibleSurveys = await this.getSurveys({ currentUser: statsFilters.currentUser });
      
      const users = await this.getAllUsers();
      let validObservers = [];
      if (filters.currentUser) {
          if (filters.currentUser.role === 'admin' || filters.currentUser.role === 'district_director') {
              validObservers = users.filter(u => u.role === 'district_researcher' || u.role === 'teacher').map(u => u.name);
          } else if (filters.currentUser.role === 'principal') {
              validObservers = users.filter(u => u.role === 'teacher' && u.school === filters.currentUser.school).map(u => u.name);
          } else {
              validObservers = [filters.currentUser.name];
          }
      } else {
          validObservers = users.filter(u => u.role === 'district_researcher' || u.role === 'teacher').map(u => u.name);
      }
      const surveyObservers = accessibleSurveys.map(s => s.observer).filter(Boolean);
      const allObservers = [...new Set([...validObservers, ...surveyObservers])];
      
      const allSchools = [...new Set(accessibleSurveys.map(s => s.school).filter(Boolean))];
      const allSubjects = [...new Set(accessibleSurveys.map(s => s.subject).filter(Boolean))];

      const schoolSet = new Set(surveys.map(s => s.school).filter(Boolean));
      
      const subjectCounts = {};
      const lessonTypeCounts = {};
      const schoolCounts = {};

      surveys.forEach(s => {
          if (s.subject) {
            subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
          }
          
          if (s.lesson_type) {
            let typeName = s.lesson_type;
            const typeMap = {
              'new': '新授课',
              'review': '复习课',
              'exercise': '习题课',
              'experiment': '实验课',
              'other': '其它'
            };
            typeName = typeMap[s.lesson_type] || s.lesson_type;
            lessonTypeCounts[typeName] = (lessonTypeCounts[typeName] || 0) + 1;
          }

          if (s.school) {
            schoolCounts[s.school] = (schoolCounts[s.school] || 0) + 1;
          }
      });

      const data = Object.keys(subjectCounts).map(key => ({
        name: key,
        count: subjectCounts[key]
      }));

      const lessonTypeData = Object.keys(lessonTypeCounts).map(key => ({
        name: key,
        value: lessonTypeCounts[key]
      }));

      const totalSchoolCount = surveys.filter(s => s.school).length;
      const schoolCoverageData = Object.keys(schoolCounts)
        .map(key => ({
          name: key,
          count: schoolCounts[key],
          percent: totalSchoolCount > 0 ? Math.round((schoolCounts[key] / totalSchoolCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

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

      const schoolsData = await this.getSchools();
      const totalSystemSchools = schoolsData.length;
      return {
          schoolCount: schoolSet.size,
          totalSurveys: surveys.length,
          completedSurveys: surveys.filter(s => s.status === 'completed').length,
          coverage: schoolSet.size > 0 && totalSystemSchools > 0 ? Math.round((schoolSet.size / totalSystemSchools) * 100) : 0,
          subjectData: data,
          lessonTypeData,
          schoolCoverageData,
          monthlyStats,
          allObservers,
          allSchools,
          allSubjects
      };
  },

  async getCompletionStats(currentUser = null) {
      const targets = await this.getTargets();
      const users = await this.getAllUsers();
      const surveys = await this._getAllSurveysRaw();
      
      // Determine managed users if currentUser is provided
      let managedUsernames = null;
      if (currentUser) {
          let managedUsers = [];
          if (currentUser.role === 'district_director' || currentUser.role === 'admin') {
              managedUsers = [...managedUsers, ...users.filter(u => u.role === 'district_researcher')];
          }
          if (currentUser.role === 'principal' || currentUser.role === 'admin' || currentUser.role === 'district_director') {
              const teachers = users.filter(u => u.role === 'teacher');
              if (currentUser.role === 'principal') {
                  managedUsers = [...managedUsers, ...teachers.filter(t => t.school === currentUser.school)];
              } else {
                  managedUsers = [...managedUsers, ...teachers];
              }
          }
          managedUsernames = managedUsers.map(u => u.username);
      }

      // Filter targets to only include those for existing users and managed users
      const validTargets = targets.filter(t => {
          const userExists = users.some(u => u.username === t.userId);
          if (!userExists) return false;
          if (managedUsernames && !managedUsernames.includes(t.userId)) return false;
          return true;
      });

      const completionData = validTargets.map(target => {
          const user = users.find(u => u.username === target.userId);
          const userSurveys = surveys.filter(s => s.observer === user.name && s.status === 'completed');
          const completedCount = userSurveys.length;
          const targetCount = parseInt(target.targetValue) || 0;
          const percentage = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;
          
          return {
              userId: target.userId,
              name: user.name,
              targetCount,
              completedCount,
              percentage,
              isCompleted: completedCount >= targetCount
          };
      });

      const incompleteUsers = completionData.filter(d => !d.isCompleted);
      
      const totalTarget = completionData.reduce((sum, d) => sum + d.targetCount, 0);
      const totalCompleted = completionData.reduce((sum, d) => sum + d.completedCount, 0);
      const overallPercentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

      return {
          overallPercentage,
          totalTarget,
          totalCompleted,
          incompleteUsers,
          completionData
      };
  },

  async getSchools() {
        try {
            const res = await fetch(`${getApiBase()}/schools`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // 如果后端正常返回了数组（即便是空数组），都应该使用后端的数据，而不是回退到假数据
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.error('Fetch schools error:', e);
        }
        return [
            { id: '1', name: '市北四实验', region: '市北区', type: '高中' },
            { id: '2', name: '青岛五十三中', region: '市北区', type: '初中' }
        ];
    },

    async saveSchools(schools) {
        for (const s of schools) {
            const res = await fetch(`${getApiBase()}/schools`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Save schools failed on server:', text);
                throw new Error(`保存失败: ${res.status} ${text}`);
            }
        }
    },

  async deleteSchool(id) {
      try {
          await fetch(`${getApiBase()}/schools/${id}`, { method: 'DELETE' });
      } catch (e) {
          console.error('Delete school error:', e);
      }
  },

  async getSubjects() {
        try {
            const res = await fetch(`${getApiBase()}/subjects`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.error('Fetch subjects error:', e);
        }
        return [
            { id: '1', name: '语文', code: 'YU', type: '通用' },
            { id: '2', name: '数学', code: 'SHU', type: '通用' },
            { id: '3', name: '英语', code: 'YING', type: '通用' },
            { id: '4', name: '物理', code: 'WU', type: '通用' },
            { id: '5', name: '化学', code: 'HUA', type: '通用' }
        ];
    },

    async saveSubjects(subjects) {
        for (const s of subjects) {
            const res = await fetch(`${getApiBase()}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Save subjects failed on server:', text);
                throw new Error(`保存失败: ${res.status} ${text}`);
            }
        }
    },

  async deleteSubject(id) {
      try {
          await fetch(`${getApiBase()}/subjects/${id}`, { method: 'DELETE' });
      } catch (e) {
          console.error('Delete subject error:', e);
      }
  },

  async getUserGroups() {
      try {
          const res = await fetch(`${getApiBase()}/userGroups`);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          return data || [];
      } catch (e) {
          console.error('Fetch userGroups error:', e);
          return [];
      }
  },

  async saveUserGroups(groups) {
        for (const g of groups) {
            const res = await fetch(`${getApiBase()}/userGroups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(g)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Save userGroups failed on server:', text);
                throw new Error(`保存失败: ${res.status} ${text}`);
            }
        }
    },

  async deleteUserGroup(id) {
      try {
          await fetch(`${getApiBase()}/userGroups/${id}`, { method: 'DELETE' });
      } catch (e) {
          console.error('Delete userGroup error:', e);
      }
  }
};

export default DataService;
