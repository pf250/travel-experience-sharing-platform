const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});

exports.main = async (event, context) => {
  const { code, userInfo } = event;

  try {
    // 获取用户的 OPENID
    const { OPENID } = cloud.getWXContext();

    // 获取云数据库实例
    const db = cloud.database();
    const userCollection = db.collection('users');

    // 检查用户是否已存在
    const user = await userCollection.where({ openid: OPENID }).get();

    if (user.data.length > 0) {
      // 如果用户已存在，直接返回现有的 userId
      const existingUser = user.data[0];
      console.log('用户已存在:', existingUser);
      return {
        success: true,
        userId: existingUser.userId
      };
    }

    // 如果用户不存在，则插入新用户，并生成新的 userId
    const countersCollection = db.collection('counters');

    // 查询或初始化计数器
    let counter = await countersCollection.where({ _id: 'userCounter' }).get();

    if (counter.data.length === 0) {
      // 如果计数器不存在，则初始化
      await countersCollection.add({
        data: {
          _id: 'userCounter',
          count: 1000 // 初始值设置为 1000
        }
      });
      counter = { data: [{ count: 1000 }] };
    }

    // 更新计数器并获取新的 userId（仅在插入新用户时触发）
    const newUserId = counter.data[0].count + 1;
    await countersCollection.doc('userCounter').update({
      data: {
        count: newUserId // 自增 1
      }
    });

    // 插入新用户数据
    await userCollection.add({
      data: {
        userId: newUserId, // 使用自增的 userId
        openid: OPENID, // 保存 OPENID 以备后续使用
        nickName: userInfo.nickName || '', // 用户昵称
        avatarUrl: userInfo.avatarUrl || '', // 用户头像
        role:"user", //身份（）'user', 'vip', 'admin', 'merchant'
        name: '', // 姓名（默认为空字符串）
        sex: '', // 性别（默认为空字符串）
        phone: '', // 手机号（默认为空字符串）
        registerTime: db.serverDate() // 注册时间（当前时间）
      }
    });

    console.log('新用户注册成功:', { success: true, userId: newUserId });
    return {
      success: true,
      userId: newUserId // 返回自增的 userId
    };
  } catch (err) {
    console.error('登录失败:', err);
    return {
      success: false,
      errMsg: err.message
    };
  }
};