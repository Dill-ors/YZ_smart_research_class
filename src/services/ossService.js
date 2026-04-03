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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result, fileName: file.name, ossId: Date.now().toString() });
    };
    reader.onerror = () => {
      reject(new Error('图片读取失败'));
    };
    reader.readAsDataURL(file);
  });
}
