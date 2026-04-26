/**
 * SQLite -> MySQL 数据迁移脚本 (关系型表结构)
 * 用法：cd server && DB_HOST=localhost DB_USER=root DB_PASSWORD=xxx DB_NAME=smart_research node migrate-sqlite-to-mysql.js
 */
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

const DB_PATH = process.env.SQLITE_DB || path.resolve(__dirname, 'database.db');
const MYSQL_HOST = process.env.DB_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const MYSQL_USER = process.env.DB_USER || 'root';
const MYSQL_PASSWORD = process.env.DB_PASSWORD || '';
const MYSQL_DB = process.env.DB_NAME || 'smart_research';

// Field mapping: JS property -> SQL column
const FIELD_MAP = {
  users: {
    id: 'id', username: 'username', password: 'password', name: 'name',
    role: 'role', school: 'school', subject: 'subject', status: 'status',
    createdAt: 'created_at'
  },
  schools: {
    id: 'id', name: 'name', region: 'region', type: 'type', createdAt: 'created_at'
  },
  subjects: {
    id: 'id', name: 'name', code: 'code', type: 'type', createdAt: 'created_at'
  },
  targets: {
    id: 'id', userId: 'user_id', userName: 'user_name', targetType: 'target_type',
    targetValue: 'target_value', period: 'period', setterId: 'setter_id', setterName: 'setter_name',
    createdAt: 'created_at'
  },
  surveys: {
    id: 'id', status: 'status', school: 'school', grade: 'grade', class: 'class',
    subject: 'subject', teacher: 'teacher', observer: 'observer', date: 'date',
    survey_mode: 'survey_mode', topic: 'topic', lesson_type: 'lesson_type', period: 'period',
    teacher_target: 'teacher_target', teacher_content: 'teacher_content',
    teacher_method: 'teacher_method', teacher_org: 'teacher_org',
    teacher_literacy: 'teacher_literacy', student_participation: 'student_participation',
    student_thinking: 'student_thinking', student_achievement: 'student_achievement',
    highlights: 'highlights', problems_suggestions: 'problems_suggestions',
    school_suggestions: 'school_suggestions', overall_evaluation: 'overall_evaluation',
    recordMode: 'record_mode', title: 'title', createdBy: 'created_by',
    images: 'images', processSteps: 'process_steps', customSurveyData: 'custom_survey_data',
    createdAt: 'created_at'
  },
  reports: {
    id: 'id', title: 'title', description: 'description', status: 'status',
    category: 'category', created_at: 'created_at', response_count: 'response_count',
    autoNumbering: 'auto_numbering', questions: 'questions', publishConfig: 'publish_config'
  },
  responses: {
    id: 'id', surveyId: 'survey_id', userId: 'user_id', userName: 'user_name',
    role: 'role', answers: 'answers', time: 'time'
  },
  userGroups: {
    id: 'id', name: 'name', description: 'description', members: 'members',
    createdAt: 'created_at'
  }
};

const JSON_COLUMNS = {
  surveys: ['images', 'process_steps', 'custom_survey_data', 'extra_data'],
  reports: ['questions', 'publish_config'],
  responses: ['answers'],
  userGroups: ['members']
};

function toSqlValue(table, jsKey, value) {
  if (value === undefined || value === null) return null;
  const map = FIELD_MAP[table];
  if (!map || !map[jsKey]) return null;
  const col = map[jsKey];
  const jsonCols = JSON_COLUMNS[table] || [];
  if (jsonCols.includes(col)) {
    return JSON.stringify(value);
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
    if (jsKey in item) {
      columns.push(sqlKey);
      const v = toSqlValue(table, jsKey, item[jsKey]);
      values.push(v);
      if (sqlKey !== 'id' && sqlKey !== 'created_at') {
        updates.push(`${sqlKey} = VALUES(${sqlKey})`);
      }
    }
  }

  // For surveys, collect unknown keys into extra_data
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
      if (!updates.includes('extra_data = VALUES(extra_data)')) {
        updates.push('extra_data = VALUES(extra_data)');
      }
    }
  }

  if (columns.length === 0) return null;
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})` +
    (updates.length > 0 ? ` ON DUPLICATE KEY UPDATE ${updates.join(', ')}` : '');
  return { sql, values };
}

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

async function migrate() {
  console.log('=== SQLite -> MySQL 关系型表数据迁移 ===');
  console.log(`SQLite: ${DB_PATH}`);
  console.log(`MySQL: ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}`);

  const sqlite = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('无法打开 SQLite 数据库:', err.message);
      process.exit(1);
    }
  });

  const pool = mysql.createPool({
    host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER,
    password: MYSQL_PASSWORD, database: MYSQL_DB,
    charset: 'utf8mb4', connectionLimit: 5
  });

  try {
    await pool.execute('SELECT 1');
    console.log('MySQL 连接成功');
  } catch (err) {
    console.error('MySQL 连接失败:', err.message);
    process.exit(1);
  }

  const tables = ['surveys', 'users', 'targets', 'reports', 'responses', 'schools', 'subjects', 'userGroups'];
  let totalMigrated = 0;

  for (const table of tables) {
    console.log(`\n迁移表: ${table}`);

    // Ensure MySQL table exists with relational schema
    if (TABLE_SCHEMAS[table]) {
      await pool.execute(TABLE_SCHEMAS[table]);
    }
    // Clear existing data
    await pool.execute(`DELETE FROM ${table}`);

    // Read SQLite data
    const rows = await new Promise((resolve, reject) => {
      sqlite.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (rows.length === 0) {
      console.log(`  ${table}: 无数据`);
      continue;
    }

    // Migrate with field mapping
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const row of rows) {
        let item;
        try {
          item = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch (e) {
          console.warn(`  Skip invalid JSON in ${table}:`, row.id);
          continue;
        }
        if (!item.id) item.id = row.id;

        const ins = buildInsertSql(table, item);
        if (ins) {
          await conn.execute(ins.sql, ins.values);
        } else {
          console.warn(`  Skip unmapped item in ${table}:`, item.id);
        }
      }
      await conn.commit();
      console.log(`  ${table}: ${rows.length} 条记录已迁移 ✓`);
      totalMigrated += rows.length;
    } catch (err) {
      await conn.rollback();
      console.error(`  ${table}: 迁移失败 ✗`, err.message);
    } finally {
      conn.release();
    }
  }

  sqlite.close();
  await pool.end();
  console.log(`\n=== 迁移完成，共 ${totalMigrated} 条记录 ===`);
}

migrate().catch(err => {
  console.error('迁移异常:', err);
  process.exit(1);
});
