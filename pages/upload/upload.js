Page({
  // 检查登录状态的方法
  checkLogin() {
    // 从本地缓存中获取登录状态
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin; // 如果有登录状态且 isLogin 为 true，则返回 true
  },

  // 处理发闲置按钮点击事件
  handleUploadIdle: function () {
    // 检查是否时登录状态
    const isLoggedIn = this.checkLogin();
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      // 未登录时跳转到指定页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile', // 确保路径正确
        });
      }, 1000); // 1秒后跳转
      return;
    }
    
    // 已登录，跳转到发闲置页面
    wx.navigateTo({
      url: '/packageUpload/pages/items/items'
    });
  },

  // 处理发帖子按钮点击事件
  handleUploadPost: function () {
    // 检查是否时登录状态
    const isLoggedIn = this.checkLogin();
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      // 未登录时跳转到指定页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile', // 确保路径正确
        });
      }, 1000); // 1秒后跳转
      return;
    }
    
    // 已登录，跳转到发帖子页面
    wx.navigateTo({
      url: '/packageUpload/pages/posts/posts'
    });
  }
});