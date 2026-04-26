const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_research',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// ---------- Table Schemas (Relational) ----------

const TABLE_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      role VARCHAR(50),
      school VARCHAR(255),
      subject VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  schools: `
    CREATE TABLE IF NOT EXISTS schools (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(100),
      type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  subjects: `
    CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50),
      type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  targets: `
    CREATE TABLE IF NOT EXISTS targets (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255),
      user_name VARCHAR(100),
      target_type VARCHAR(50),
      target_value INT,
      period VARCHAR(50),
      setter_id VARCHAR(255),
      setter_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  surveys: `
    CREATE TABLE IF NOT EXISTS surveys (
      id VARCHAR(255) PRIMARY KEY,
      status VARCHAR(50),
      school VARCHAR(255),
      grade VARCHAR(50),
      class VARCHAR(50),
      subject VARCHAR(100),
      teacher VARCHAR(100),
      observer VARCHAR(100),
      date VARCHAR(50),
      survey_mode VARCHAR(50),
      topic VARCHAR(500),
      lesson_type VARCHAR(50),
      period VARCHAR(50),
      teacher_target TEXT,
      teacher_content TEXT,
      teacher_method TEXT,
      teacher_org TEXT,
      teacher_literacy TEXT,
      student_participation TEXT,
      student_thinking TEXT,
      student_achievement TEXT,
      highlights TEXT,
      problems_suggestions TEXT,
      school_suggestions TEXT,
      overall_evaluation LONGTEXT,
      record_mode VARCHAR(50),
      title VARCHAR(500),
      created_by VARCHAR(255),
      images JSON,
      process_steps JSON,
      custom_survey_data JSON,
      extra_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  reports: `
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500),
      description TEXT,
      status VARCHAR(50),
      category VARCHAR(100),
      created_at VARCHAR(50),
      response_count INT DEFAULT 0,
      auto_numbering BOOLEAN DEFAULT FALSE,
      questions JSON,
      publish_config JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  responses: `
    CREATE TABLE IF NOT EXISTS responses (
      id VARCHAR(255) PRIMARY KEY,
      survey_id VARCHAR(255),
      user_id VARCHAR(100),
      user_name VARCHAR(100),
      role VARCHAR(50),
      answers JSON,
      time VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  userGroups: `
    CREATE TABLE IF NOT EXISTS userGroups (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      description TEXT,
      members JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// ---------- Field Mappings (JS property -> SQL column) ----------

const FIELD_MAP = {
  users: {
    id: 'id', username: 'username', password: 'password', name: 'name',
    role: 'role', school: 'school', subject: 'subject', status: 'status',
    createdAt: 'created_at', updatedAt: 'updated_at'
  },
  schools: {
    id: 'id', name: 'name', region: 'region', type: 'type',
    createdAt: 'created_at', updatedAt: 'updated_at'
  },
  subjects: {
    id: 'id', name: 'name', code: 'code', type: 'type',
    createdAt: 'created_at', updatedAt: 'updated_at'
  },
  targets: {
    id: 'id', userId: 'user_id', userName: 'user_name', targetType: 'target_type',
    targetValue: 'target_value', period: 'period', setterId: 'setter_id',
    setterName: 'setter_name', createdAt: 'created_at', updatedAt: 'updated_at'
  },
  surveys: {
    id: 'id', status: 'status', school: 'school', grade: 'grade', class: 'class',
    subject: 'subject', teacher: 'teacher', observer: 'observer', date: 'date',
    survey_mode: 'survey_mode', topic: 'topic', lesson_type: 'lesson_type',
    period: 'period', teacher_target: 'teacher_target', teacher_content: 'teacher_content',
    teacher_method: 'teacher_method', teacher_org: 'teacher_org',
    teacher_literacy: 'teacher_literacy', student_participation: 'student_participation',
    student_thinking: 'student_thinking', student_achievement: 'student_achievement',
    highlights: 'highlights', problems_suggestions: 'problems_suggestions',
    school_suggestions: 'school_suggestions', overall_evaluation: 'overall_evaluation',
    recordMode: 'record_mode', title: 'title', createdBy: 'created_by',
    images: 'images', processSteps: 'process_steps', customSurveyData: 'custom_survey_data',
    createdAt: 'created_at', updatedAt: 'updated_at'
  },
  reports: {
    id: 'id', title: 'title', description: 'description', status: 'status',
    category: 'category', created_at: 'created_at', response_count: 'response_count',
    autoNumbering: 'auto_numbering', questions: 'questions',
    publishConfig: 'publish_config', updatedAt: 'updated_at'
  },
  responses: {
    id: 'id', surveyId: 'survey_id', userId: 'user_id', userName: 'user_name',
    role: 'role', answers: 'answers', time: 'time',
    createdAt: 'created_at', updatedAt: 'updated_at'
  },
  userGroups: {
    id: 'id', name: 'name', description: 'description', members: 'members',
    createdAt: 'created_at', updatedAt: 'updated_at'
  }
};

// Columns that should be stored as JSON
const JSON_COLUMNS = {
  surveys: ['images', 'process_steps', 'custom_survey_data', 'extra_data'],
  reports: ['questions', 'publish_config'],
  responses: ['answers'],
  userGroups: ['members']
};

// ---------- Helper Functions ----------

function toSqlValue(table, jsKey, value) {
  if (value === undefined || value === null) return null;
  const jsonCols = JSON_COLUMNS[table] || [];
  const col = FIELD_MAP[table]?.[jsKey];
  if (!col) return null; // unknown field
  if (jsonCols.includes(col)) {
    return JSON.stringify(value);
  }
  return value;
}

function fromSqlValue(table, sqlKey, value) {
  if (value === undefined || value === null) return null;
  const jsonCols = JSON_COLUMNS[table] || [];
  if (jsonCols.includes(sqlKey)) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      return value;
    }
  }
  return value;
}

function buildInsertSql(table, item) {
  const map = FIELD_MAP[table];
  const jsonCols = JSON_COLUMNS[table] || [];
  const columns = [];
  const values = [];
  const updates = [];

  for (const [jsKey, sqlKey] of Object.entries(map)) {
    if (jsKey === 'updatedAt') continue; // auto-updated by MySQL
    if (jsKey in item) {
      columns.push(sqlKey);
      const v = toSqlValue(table, jsKey, item[jsKey]);
      values.push(v);
      if (sqlKey !== 'id' && sqlKey !== 'created_at') {
        updates.push(`${sqlKey} = VALUES(${sqlKey})`);
      }
    }
  }

  // For surveys, collect any unknown keys into extra_data
  if (table === 'surveys') {
    const knownKeys = new Set(Object.keys(map));
    const extra = {};
    let hasExtra = false;
    for (const [k, v] of Object.entries(item)) {
      if (!knownKeys.has(k)) {
        extra[k] = v;
        hasExtra = true;
      }
    }
    if (hasExtra) {
      const idx = columns.indexOf('extra_data');
      if (idx >= 0) {
        values[idx] = JSON.stringify(extra);
      } else {
        columns.push('extra_data');
        values.push(JSON.stringify(extra));
      }
      updates.push('extra_data = VALUES(extra_data)');
    }
  }

  if (columns.length === 0) return null;

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})` +
    (updates.length > 0 ? ` ON DUPLICATE KEY UPDATE ${updates.join(', ')}` : '');
  return { sql, values };
}

function rowToObject(table, row) {
  const map = FIELD_MAP[table];
  const result = {};
  // Reverse map: sqlKey -> jsKey
  const reverseMap = {};
  for (const [jsKey, sqlKey] of Object.entries(map)) {
    reverseMap[sqlKey] = jsKey;
  }

  for (const [sqlKey, value] of Object.entries(row)) {
    const jsKey = reverseMap[sqlKey];
    if (jsKey) {
      result[jsKey] = fromSqlValue(table, sqlKey, value);
    }
  }

  // Merge extra_data for surveys
  if (table === 'surveys' && row.extra_data) {
    try {
      const extra = typeof row.extra_data === 'string' ? JSON.parse(row.extra_data) : row.extra_data;
      Object.assign(result, extra);
    } catch (e) {}
  }

  return result;
}

// ---------- DB Initialization ----------

async function initDb() {
  for (const [table, schema] of Object.entries(TABLE_SCHEMAS)) {
    await pool.execute(schema);
  }

  // Seed default users if empty
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    const defaultUsers = [
      { id: 'u1', username: 'admin', password: '123', name: '系统管理员', role: 'admin' },
      { id: 'u2', username: 'director', password: '123', name: '王主任', role: 'district_director' },
      { id: 'u3', username: 'researcher1', password: '123', name: '李调研员', role: 'district_researcher' },
      { id: 'u4', username: 'principal1', password: '123', name: '赵校长', role: 'principal', school: '市北四实验' },
      { id: 'u5', username: 'teacher1', password: '123', name: '孙老师', role: 'teacher', subject: '数学', school: '市北四实验' },
      { id: 'u6', username: 'teacher2', password: '123', name: '张老师', role: 'teacher', subject: '物理', school: '市北四实验' }
    ];
    for (const u of defaultUsers) {
      const ins = buildInsertSql('users', u);
      if (ins) await pool.execute(ins.sql, ins.values);
    }
    console.log('Default users initialized successfully.');
  }
}

async function initWithRetry(maxRetries = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initDb();
      console.log('Database initialized successfully.');
      return;
    } catch (err) {
      console.error(`Database init attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

initWithRetry();

// ---------- Routes ----------

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Generic CRUD routes with field mapping
const setupTableRoutes = (tableName) => {
  // GET all
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${tableName}`);
      const data = rows.map(row => rowToObject(tableName, row));
      res.json(data);
    } catch (err) {
      console.error(`GET /api/${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST (Insert or Update)
  app.post(`/api/${tableName}`, async (req, res) => {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing id field' });
    }

    const ins = buildInsertSql(tableName, item);
    if (!ins) {
      return res.status(400).json({ error: 'No valid fields to insert' });
    }

    try {
      const [result] = await pool.execute(ins.sql, ins.values);
      res.json({ message: result.insertId && result.affectedRows === 1 ? 'inserted' : 'updated', item });
    } catch (err) {
      console.error(`POST /api/${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    const id = req.params.id;
    try {
      const [result] = await pool.execute(
        `DELETE FROM ${tableName} WHERE id = ?`, [id]
      );
      res.json({ message: 'deleted', changes: result.affectedRows });
    } catch (err) {
      console.error(`DELETE /api/${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });
};

setupTableRoutes('users');
setupTableRoutes('schools');
setupTableRoutes('subjects');
setupTableRoutes('targets');
setupTableRoutes('surveys');
setupTableRoutes('reports');
setupTableRoutes('responses');
setupTableRoutes('userGroups');

// Restore data endpoint — transactional atomic restore
app.post('/api/restore', async (req, res) => {
  const { surveys, users, targets, reports, responses, schools, subjects, userGroups } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const tables = ['surveys', 'users', 'targets', 'reports', 'responses', 'schools', 'subjects', 'userGroups'];
    for (const table of tables) {
      await conn.execute(`DELETE FROM ${table}`);
    }

    const insertData = async (tableName, dataArray) => {
      if (!dataArray || !Array.isArray(dataArray)) return;
      for (const item of dataArray) {
        if (item.id) {
          const ins = buildInsertSql(tableName, item);
          if (ins) await conn.execute(ins.sql, ins.values);
        }
      }
    };

    await insertData('surveys', surveys);
    await insertData('users', users);
    await insertData('targets', targets);
    await insertData('reports', reports);
    await insertData('responses', responses);
    await insertData('schools', schools);
    await insertData('subjects', subjects);
    await insertData('userGroups', userGroups);

    await conn.commit();
    res.json({ message: 'Restore successful' });
  } catch (err) {
    await conn.rollback();
    console.error('Restore error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`Database: MySQL ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'smart_research'}`);
});
