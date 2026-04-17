const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径，和 server.js 中保持一致
const dbPath = path.resolve(__dirname, 'database.db');

// 测试配置
const CONCURRENCY_LEVEL = 500; // 并发连接数（这才是真正的并发！）
const OPERATIONS_PER_CONNECTION = 100; // 每个连接执行的操作数
const READ_WRITE_RATIO = 0.5;   // 读写比例，0.5表示约50%是读，50%是写

let totalSuccessWrites = 0;
let totalFailedWrites = 0;
let totalSuccessReads = 0;
let totalFailedReads = 0;

const startTime = Date.now();

console.log(`========================================`);
console.log(` 测试配置:`);
console.log(` - 并发连接数: ${CONCURRENCY_LEVEL}`);
console.log(` - 每连接操作数: ${OPERATIONS_PER_CONNECTION}`);
console.log(` - 总操作数: ${CONCURRENCY_LEVEL * OPERATIONS_PER_CONNECTION}`);
console.log(` - 读写比例  : 读 ${READ_WRITE_RATIO * 100}% / 写 ${(1 - READ_WRITE_RATIO) * 100}%`);
console.log(`========================================\n`);

// 为每个并发连接创建一个独立的数据库连接
const connectionPromises = [];

for (let connIndex = 0; connIndex < CONCURRENCY_LEVEL; connIndex++) {
  connectionPromises.push(new Promise((resolveConnection) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(`连接 ${connIndex} 数据库失败:`, err);
        resolveConnection();
        return;
      }

      let successWrites = 0;
      let failedWrites = 0;
      let successReads = 0;
      let failedReads = 0;

      const operationPromises = [];

      // 每个连接执行多个操作
      for (let opIndex = 0; opIndex < OPERATIONS_PER_CONNECTION; opIndex++) {
        operationPromises.push(new Promise((resolveOperation) => {
          const isWrite = Math.random() > READ_WRITE_RATIO;

          if (isWrite) {
            // 模拟写入操作
            const id = `perf_test_${Date.now()}_${connIndex}_${opIndex}_${Math.random()}`;
            const data = JSON.stringify({ 
              message: 'Load test data', 
              connIndex, 
              opIndex, 
              timestamp: Date.now() 
            });
            
            db.run('INSERT INTO surveys (id, data) VALUES (?, ?)', [id, data], function(err) {
              if (err) {
                failedWrites++;
                if (failedWrites <= 1) {
                  console.error(`  [连接 ${connIndex} 写入报错] ${err.message}`);
                }
              } else {
                successWrites++;
              }
              resolveOperation();
            });
          } else {
            // 模拟读取操作
            db.all('SELECT * FROM surveys ORDER BY id DESC LIMIT 10', [], (err, rows) => {
              if (err) {
                failedReads++;
                if (failedReads <= 1) {
                  console.error(`  [连接 ${connIndex} 读取报错] ${err.message}`);
                }
              } else {
                successReads++;
              }
              resolveOperation();
            });
          }
        }));
      }

      // 等待当前连接的所有操作完成
      Promise.all(operationPromises).then(() => {
        totalSuccessWrites += successWrites;
        totalFailedWrites += failedWrites;
        totalSuccessReads += successReads;
        totalFailedReads += failedReads;
        
        db.close((err) => {
          if (err) console.error(`连接 ${connIndex} 关闭失败:`, err);
          resolveConnection();
        });
      });
    });
  }));
}

// 等待所有并发操作完成
Promise.all(connectionPromises).then(() => {
  const duration = Date.now() - startTime;
  
  console.log(`\n========================================`);
  console.log(` 测试结果报告:`);
  console.log(` - 总耗时    : ${duration} ms`);
  console.log(` - 写入操作  : 成功 ${totalSuccessWrites} 次, 失败 ${totalFailedWrites} 次`);
  console.log(` - 读取操作  : 成功 ${totalSuccessReads} 次, 失败 ${totalFailedReads} 次`);
  
  const totalSuccess = totalSuccessWrites + totalSuccessReads;
  const throughput = (totalSuccess / (duration / 1000)).toFixed(2);
  console.log(` - 成功吞吐量: ${throughput} ops/sec (每秒处理操作数)`);
  console.log(`========================================`);

  if (totalFailedWrites > 0 || totalFailedReads > 0) {
    console.log(`\n[分析与建议]`);
    console.log(`发现失败的操作。在默认模式下，SQLite 处理高并发写入时容易遇到数据库锁 (SQLITE_BUSY)。`);
    console.log(`解决建议：在 server.js 数据库初始化时执行 db.run('PRAGMA journal_mode = WAL;') 开启预写日志模式，可大幅提升读写并发性能。`);
  } else {
    console.log(`\n[分析与建议]`);
    console.log(`测试通过，当前并发量下未出现数据库锁 (SQLITE_BUSY) 报错。`);
  }

  // 清理测试产生的脏数据 - 需要重新创建连接来清理
  console.log(`\n正在清理测试数据...`);
  const cleanupDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('清理连接失败:', err);
      return;
    }
    cleanupDb.run(`DELETE FROM surveys WHERE id LIKE 'perf_test_%'`, () => {
      cleanupDb.close(() => {
        console.log(`清理完成，测试结束。`);
      });
    });
  });
});
