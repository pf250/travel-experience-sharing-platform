Page({
  data: {
    isLogin: false, // 是否已登录
    avatarUrl: '',  // 用户头像
    nickName: '',   // 用户昵称
    userId: '',     // 用户唯一标识（自增数字）
    role: ''        // 用户身份
  },

  /**
   * 页面加载时检查本地存储的登录状态
   */
  onLoad(options) {
    const that = this;

    // 从 URL 参数中获取头像、昵称、userId 和 role
    const { avatarUrl, nickName, userId, role } = options;
    if (avatarUrl && nickName && userId) {
      // 如果有 URL 参数，优先使用
      this.setData({
        isLogin: true,
        avatarUrl: decodeURIComponent(avatarUrl),
        nickName: decodeURIComponent(nickName),
        userId: userId,
        role: role || ''  // 如果role不存在则设为空字符串
      });

      // 更新本地存储中的登录状态
      wx.setStorageSync('loginState', {
        isLogin: true,
        avatarUrl: decodeURIComponent(avatarUrl),
        nickName: decodeURIComponent(nickName),
        userId: userId,
        role: role || ''
      });
    } else {
      // 如果没有传递参数，则从本地存储中读取登录状态
      const loginState = wx.getStorageSync('loginState');
      if (loginState && loginState.isLogin) {
        this.setData({
          isLogin: true,
          avatarUrl: loginState.avatarUrl,
          nickName: loginState.nickName,
          userId: loginState.userId,
          role: loginState.role || ''  // 确保role有默认值
        });

        // 根据 userId 查询用户信息
        if (loginState.userId) {
          this.loadUserInfo(loginState.userId);
        }
      } else {
        // 如果未登录，设置默认状态
        this.setData({
          isLogin: false,
          avatarUrl: '', // 默认头像为空
          nickName: '游客', // 默认昵称为"游客"
          userId: '', // userId 为空
          role: ''    // role 为空
        });

        console.log('用户未登录，设置为游客状态');
      }
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo(userId) {
    const that = this;
    const db = wx.cloud.database();

    db.collection('users')
      .where({ userId: parseInt(userId) })
      .get()
      .then((queryRes) => {
        if (queryRes.data.length > 0) {
          const userData = queryRes.data[0];
          that.setData({
            avatarUrl: userData.avatarUrl,
            nickName: userData.nickName,
            role: userData.role || ''  // 从数据库获取role，如果没有则设为空
          });

          // 更新本地存储中的登录状态
          wx.setStorageSync('loginState', {
            isLogin: true,
            avatarUrl: userData.avatarUrl,
            nickName: userData.nickName,
            userId: userId,
            role: userData.role || ''
          });
        } else {
          console.warn('用户信息不存在');
        }
      })
      .catch((err) => {
        console.error('查询用户信息失败:', err);
      });
  },

  /**
   * 点击登录按钮触发的事件
   */
  handleLogin() {
    const that = this;
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes) => {
        const { userInfo } = profileRes;
        const { avatarUrl, nickName } = userInfo;
        // 更新页面数据
        that.setData({
          isLogin: true,
          avatarUrl: avatarUrl,
          nickName: nickName
        });
        // 调用 wx.login 获取 code
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 将用户信息和 code 发送到云函数进行处理
              wx.cloud.callFunction({
                name: 'login',
                data: {
                  code: loginRes.code,
                  userInfo: {
                    nickName: nickName,
                    avatarUrl: avatarUrl
                  }
                },
                success: (res) => {
                  wx.hideLoading();
                  if (res.result.success) {
                    const { userId, role } = res.result; // 获取自增的 userId 和 role
                    that.setData({ 
                      userId: userId,
                      role: role || ''  // 设置role，如果没有则设为空
                    });
                    // 查询最新用户信息
                    that.loadUserInfo(userId);
                  } else {
                    console.error('登录失败:', res);
                    wx.showToast({
                      title: '登录失败，请重试',
                      icon: 'none'
                    });
                  }
                },
                fail: (err) => {
                  wx.hideLoading();
                  console.error('登录失败:', err);
                  wx.showToast({
                    title: '登录失败，请重试',
                    icon: 'none'
                  });
                }
              });
            } else {
              wx.hideLoading();
              console.error('登录失败！' + loginRes.errMsg);
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
            }
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 跳转到个人信息页面
   */
  navigateToUserInfo() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    // 携带 userId 跳转到个人信息页面
    wx.navigateTo({
      url: `/packageProfile/pages/userinfo/userinfo?userId=${this.data.userId}`,
    });
  },

  /**
   * 跳转到我的发帖页面
   */
  navigateToMyPosts() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 携带 userId 跳转到我的发帖页面
    wx.navigateTo({
      url: `/packageProfile/pages/myposts/myposts?userId=${this.data.userId}`,
    });
  },

  /**
   * 跳转到我的商品页面
   */
  navigateToMyGoods() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 携带 userId 跳转到我的商品页面
    wx.navigateTo({
      url: `/packageProfile/pages/mygoods/mygoods?userId=${this.data.userId}`,
    });
  },

  /**
   * 跳转到我的收藏页面
   */
  navigateToMyFavorites() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 携带 userId 跳转到我的收藏页面
    wx.navigateTo({
      url: `/packageProfile/pages/myfavorites/myfavorites?userId=${this.data.userId}`,
    });
  },

   /**
 * 跳转到特权中心页面
 */
navigateToPrivilege() {
  if (!this.data.isLogin) {
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }

  const that = this;
  const db = wx.cloud.database();
  
  // 显示加载中提示
  wx.showLoading({
    title: '加载中...',
    mask: true
  });

  // 查询用户最新的role信息
  db.collection('users')
    .where({ userId: parseInt(this.data.userId) })
    .get()
    .then((queryRes) => {
      wx.hideLoading();
      if (queryRes.data.length > 0) {
        const userData = queryRes.data[0];
        const latestRole = userData.role || 'user'; // 默认值为'user'
        
        // 更新本地数据
        that.setData({
          role: latestRole
        });
        
        // 更新本地存储
        wx.setStorageSync('loginState', {
          ...wx.getStorageSync('loginState'),
          role: latestRole
        });

        // 根据role跳转到不同的特权页面
        let targetPage = '';
        switch(latestRole) {
          case 'admin':
            targetPage = '/packageProfile/pages/privilege/admin/admin';
            break;
          case 'merchant':
            targetPage = '/packageProfile/pages/privilege/merchant/merchant';
            break;
          case 'vip':
            targetPage = '/packageProfile/pages/privilege/vip/vip';
            break;
          case 'user':
          default:
            targetPage = '/packageProfile/pages/privilege/privilege';
        }

        wx.navigateTo({
          url: `${targetPage}?userId=${that.data.userId}&role=${latestRole}`,
        });
      } else {
        console.warn('用户信息不存在');
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    })
    .catch((err) => {
      wx.hideLoading();
      console.error('查询用户信息失败:', err);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    });
}


});