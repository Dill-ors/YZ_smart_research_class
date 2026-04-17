// ... (Keep existing imports)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    
    // 开启 WAL 模式及相关优化以提升并发性能
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA synchronous = NORMAL;');
      db.run('PRAGMA busy_timeout = 5000;');
      db.run('PRAGMA temp_store = MEMORY;');
      initDb();
    });
  }
});

// A simple queue to guarantee sequential execution of writes for each table to avoid SQLITE_CONSTRAINT entirely
const writeQueue = {};

function enqueueWrite(tableName, task) {
  if (!writeQueue[tableName]) {
    writeQueue[tableName] = Promise.resolve();
  }
  // Add task to the queue and ALWAYS return a new promise that resolves when the task finishes
  writeQueue[tableName] = writeQueue[tableName].then(() => {
    return task().catch(err => {
      console.error('Queue task error:', err);
    });
  });
}

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS surveys (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS targets (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS responses (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS schools (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS subjects (id TEXT PRIMARY KEY, data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS userGroups (id TEXT PRIMARY KEY, data TEXT)`);

    // 首次部署时自动创建默认管理员账户，确保登录可用
    db.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
      if (err) {
        console.error('Error checking users table:', err);
        return;
      }
      if (row && row.count === 0) {
        const defaultUsers = [
          { id: 'u1', username: 'admin', password: '123', name: '系统管理员', role: 'admin' },
          { id: 'u2', username: 'director', password: '123', name: '王主任', role: 'district_director' },
          { id: 'u3', username: 'researcher1', password: '123', name: '李调研员', role: 'district_researcher' },
          { id: 'u4', username: 'principal1', password: '123', name: '赵校长', role: 'principal', school: '市北四实验' },
          { id: 'u5', username: 'teacher1', password: '123', name: '孙老师', role: 'teacher', subject: '数学', school: '市北四实验' },
          { id: 'u6', username: 'teacher2', password: '123', name: '张老师', role: 'teacher', subject: '物理', school: '市北四实验' }
        ];
        const stmt = db.prepare(`INSERT INTO users (id, data) VALUES (?, ?)`);
        defaultUsers.forEach(u => stmt.run(u.id, JSON.stringify(u)));
        stmt.finalize((finalizeErr) => {
          if (finalizeErr) {
            console.error('Error initializing default users:', finalizeErr);
          } else {
            console.log('Default users initialized successfully.');
          }
        });
      }
    });
  });
}

// Helper to handle simple CRUD for a table
const setupTableRoutes = (tableName) => {
  // GET all
  app.get(`/api/${tableName}`, (req, res) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      try {
        const data = rows.map(row => JSON.parse(row.data));
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse data' });
      }
    });
  });

  // POST (Insert or Update)
  app.post(`/api/${tableName}`, (req, res) => {
    const item = req.body;
    if (!item.id) {
        return res.status(400).json({ error: 'Missing id field' });
    }
    const idStr = item.id.toString();
    const dataStr = JSON.stringify(item);

    // 对于 sqlite3 的单文件数据库，UPSERT ON CONFLICT 虽然原生，
    // 但如果在同一毫秒内多并发请求针对同一新主键做操作，即使 SQLite WAL 也会因为约束检查的竞态条件报错。
    // 所以在 Node 层用 Promise 队列把针对同一个表的并发写入排队处理，从根本上解决高并发写入同一记录的冲突。
    enqueueWrite(tableName, () => {
      return new Promise((resolve) => {
        db.get(`SELECT id FROM ${tableName} WHERE id = ?`, [idStr], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return resolve();
          }
          
          if (row) {
            // 已存在，则执行 UPDATE
            db.run(`UPDATE ${tableName} SET data = ? WHERE id = ?`, [dataStr, idStr], function(updateErr) {
              if (updateErr) res.status(500).json({ error: updateErr.message });
              else res.json({ message: 'updated', item });
              resolve();
            });
          } else {
            // 不存在，则执行 INSERT
            db.run(`INSERT INTO ${tableName} (id, data) VALUES (?, ?)`, [idStr, dataStr], function(insertErr) {
              if (insertErr) {
                // Handle rare race conditions where another insert sneaked in
                if (insertErr.code === 'SQLITE_CONSTRAINT') {
                   db.run(`UPDATE ${tableName} SET data = ? WHERE id = ?`, [dataStr, idStr], function(upErr) {
                      if (upErr) res.status(500).json({ error: upErr.message });
                      else res.json({ message: 'updated', item });
                      resolve();
                   });
                   return;
                }
                res.status(500).json({ error: insertErr.message });
              }
              else res.json({ message: 'inserted', item });
              resolve();
            });
          }
        });
      });
    });
  });

  // DELETE
  app.delete(`/api/${tableName}/:id`, (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM ${tableName} WHERE id = ?`, id, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'deleted', changes: this.changes });
    });
  });
};

setupTableRoutes('surveys');
setupTableRoutes('users');
setupTableRoutes('targets');
setupTableRoutes('reports');
setupTableRoutes('responses');
setupTableRoutes('schools');
setupTableRoutes('subjects');
setupTableRoutes('userGroups');

// Restore data endpoint
app.post('/api/restore', (req, res) => {
  const { surveys, users, targets, reports, responses, schools, subjects, userGroups } = req.body;
  
  db.serialize(() => {
    const tables = ['surveys', 'users', 'targets', 'reports', 'responses', 'schools', 'subjects', 'userGroups'];
    tables.forEach(table => {
      db.run(`DELETE FROM ${table}`);
    });

    const insertData = (tableName, dataArray) => {
      if (!dataArray || !Array.isArray(dataArray)) return;
      const stmt = db.prepare(`INSERT INTO ${tableName} (id, data) VALUES (?, ?)`);
      dataArray.forEach(item => {
        if (item.id) {
          stmt.run(item.id.toString(), JSON.stringify(item));
        }
      });
      stmt.finalize();
    };

    insertData('surveys', surveys);
    insertData('users', users);
    insertData('targets', targets);
    insertData('reports', reports);
    insertData('responses', responses);
    insertData('schools', schools);
    insertData('subjects', subjects);
    insertData('userGroups', userGroups);
  });

  res.json({ message: 'Restore successful' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`Database path: ${dbPath}`);
});
