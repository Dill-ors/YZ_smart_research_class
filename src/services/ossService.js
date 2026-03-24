const OSS_CONFIG = {
  // 开发环境使用 Vite 代理，生产环境使用 Nginx 代理
  uploadUrl: '/resource/oss/uploadUseKey',
  
  accessKey: 'abcdefghijklmnopqrstuvwxyz',
  secretKey: 'model'
};

/**
* Upload file to OSS
* @param {File} file - The file object to upload
* @returns {Promise<Object>} - The response data { url, fileName, ossId }
*/
export async function uploadToOSS(file) {
  const formData = new FormData();
  formData.append('file', file);

  const timestamp = Date.now().toString();

  try {
      const response = await fetch(OSS_CONFIG.uploadUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
              'X-AK': OSS_CONFIG.accessKey,
              'X-SIGN': OSS_CONFIG.secretKey,
              'X-TS': timestamp
          },
          body: formData
      });

      if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code === 200) {
          return result.data;
      } else {
          throw new Error(result.msg || 'Upload failed');
      }
  } catch (error) {
        console.error('OSS Upload Error:', error);
        // 检测是否为 CORS 或网络错误
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.warn('CORS Error detected. The server needs to allow cross-origin requests from this domain.');
            throw new Error('网络请求失败 (可能是 CORS 跨域限制)。请联系后端开通跨域权限，或使用代理。');
        }
        throw error;
    }
}
