// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯元器API配置
const API_CONFIG = {
  url: 'https://yuanqi.tencent.com/openapi/v1/agent/chat/completions', // API地址
  appkey: 'UhwARB9diYfIZA7PBb3JVwnjpanLLtbJ', // 用户提供的appkey
  assistant_id: '2029022031547495360', // 智能体ID（appid）
  user_id: 'pf' // 用户ID
};

// 云函数入口函数
exports.main = async (event, context) => {
  const { message } = event;
  
  try {
    console.log('云函数开始执行，message:', message);
    console.log('API配置:', API_CONFIG);
    
    // 调用腾讯元器API
    const https = require('https');
    
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        assistant_id: API_CONFIG.assistant_id,
        user_id: API_CONFIG.user_id,
        stream: false,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: message
              }
            ]
          }
        ]
      });
      
      console.log('请求数据:', postData);
      
      const options = {
        hostname: 'yuanqi.tencent.com',
        path: '/openapi/v1/agent/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.appkey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      console.log('请求选项:', options);
      
      const req = https.request(options, (res) => {
        console.log('响应状态码:', res.statusCode);
        console.log('响应头:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
          console.log('接收数据块:', chunk.toString());
        });
        res.on('end', () => {
          console.log('响应数据:', data);
          try {
            const parsedData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: parsedData
            });
          } catch (parseError) {
            console.error('解析响应数据失败:', parseError);
            resolve({
              statusCode: res.statusCode,
              data: data
            });
          }
        });
      });
      
      req.on('error', (e) => {
        console.error('请求错误:', e);
        reject(e);
      });
      
      req.write(postData);
      req.end();
    });
    
    console.log('API调用结果:', result);
    
    // 处理API响应
    if (result.statusCode === 200) {
      const response = result.data;
      console.log('API返回数据:', response);
      if (response.choices && response.choices.length > 0) {
        // 根据API文档，content可能是string类型
        let aiResponse = '';
        if (typeof response.choices[0].message.content === 'string') {
          aiResponse = response.choices[0].message.content;
        } else if (Array.isArray(response.choices[0].message.content) && response.choices[0].message.content.length > 0) {
          aiResponse = response.choices[0].message.content[0].text;
        } else {
          aiResponse = '抱歉，AI回复格式错误。';
        }
        console.log('AI回复:', aiResponse);
        return {
          code: 0,
          data: {
            response: aiResponse
          }
        };
      } else {
        console.log('API返回格式错误:', response);
        return {
          code: 400,
          message: 'API返回格式错误'
        };
      }
    } else {
      console.log('网络请求失败，状态码:', result.statusCode);
      return {
        code: result.statusCode,
        message: `网络请求失败，状态码: ${result.statusCode}`
      };
    }
  } catch (error) {
    console.error('云函数调用失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    return {
      code: 500,
      message: `云函数调用失败: ${error.message}`
    };
  }
};