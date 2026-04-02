// Data Migration Script
// run this script in browser console to migrate basic info from localStorage to SQLite
(async () => {
    console.log('开始迁移基础信息数据...');

    const getApiBase = () => 'http://localhost:3001/api';

    // 1. 迁移学校数据
    const schools = JSON.parse(localStorage.getItem('schools') || '[]');
    if (schools.length > 0) {
        console.log(`发现 ${schools.length} 条学校数据，准备迁移...`);
        for (const school of schools) {
            try {
                await fetch(`${getApiBase()}/schools`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(school)
                });
            } catch (e) {
                console.error(`迁移学校 ${school.name} 失败:`, e);
            }
        }
        console.log('学校数据迁移完成。');
    } else {
        console.log('未发现本地学校数据。');
    }

    // 2. 迁移学科数据
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    if (subjects.length > 0) {
        console.log(`发现 ${subjects.length} 条学科数据，准备迁移...`);
        for (const subject of subjects) {
            try {
                await fetch(`${getApiBase()}/subjects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subject)
                });
            } catch (e) {
                console.error(`迁移学科 ${subject.name} 失败:`, e);
            }
        }
        console.log('学科数据迁移完成。');
    } else {
         console.log('未发现本地学科数据。');
    }

    // 3. 迁移用户组数据
    const userGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    if (userGroups.length > 0) {
        console.log(`发现 ${userGroups.length} 条用户组数据，准备迁移...`);
        for (const group of userGroups) {
            try {
                await fetch(`${getApiBase()}/userGroups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(group)
                });
            } catch (e) {
                console.error(`迁移用户组 ${group.name} 失败:`, e);
            }
        }
        console.log('用户组数据迁移完成。');
    } else {
        console.log('未发现本地用户组数据。');
    }

    console.log('基础信息数据迁移脚本执行完毕。');
})();