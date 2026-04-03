const http = require('http');

const TOTAL_REQUESTS = 200; // 模拟200个并发请求
const PORT = 3000;
const TEST_ID = `test_concurrent_${Date.now()}`;

const ENDPOINT = {
  hostname: 'localhost',
  port: PORT,
  path: '/api/surveys',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

let successCount = 0;
let errorCount = 0;
let lastError = null;

const makeRequest = (reqNum) => {
  return new Promise((resolve) => {
    const req = http.request(ENDPOINT, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          successCount++;
        } else {
          errorCount++;
          lastError = data;
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      errorCount++;
      lastError = e.message;
      resolve();
    });

    req.write(JSON.stringify({
      id: TEST_ID,
      title: `并发测试标题_${reqNum}`,
      data: `{"test": "concurrent_data_${reqNum}"}`
    }));
    
    req.end();
  });
};

async function runTest() {
  console.log(`🚀 开始高并发压力测试，模拟 ${TOTAL_REQUESTS} 个并发保存请求...`);
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    promises.push(makeRequest(i));
  }
  
  await Promise.all(promises);
  
  const duration = Date.now() - startTime;
  console.log(`\n⏱️ 测试完成，耗时: ${duration}ms`);
  console.log(`✅ 成功请求数: ${successCount}`);
  console.log(`❌ 失败请求数: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 测试通过！SQLite 未出现 database is locked 或主键冲突错误。高并发保存功能稳定。');
    
    // 清理测试数据
    const delReq = http.request({ ...ENDPOINT, method: 'DELETE', path: `/api/surveys/${TEST_ID}` }, () => {
      process.exit(0);
    });
    delReq.end();
  } else {
    console.log(`\n💥 测试失败！最后一次错误信息: ${lastError}`);
    process.exit(1);
  }
}

// 延迟 1.5 秒等待服务器启动
setTimeout(runTest, 1500);