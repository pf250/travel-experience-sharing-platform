Page({
  data: {
    userId: '',
    nickName: '工作人员',
    role: '景区管理员',
    avatarUrl: '',
    showStats: true
  },

  onLoad: function(options) {
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin: function() {
    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId) {
      wx.showToast({ 
        title: '用户信息获取失败', 
        icon: 'none',
        duration: 2000
      });
      
      // 跳转到登录页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return false;
    }

    const userId = loginState.userId;
    const nickName = loginState.nickName;
    const avatarUrl = loginState.avatarUrl;

    
    this.setData({ userId });
    this.setData({ nickName });
    this.setData({ avatarUrl });
    return true;
  },

  // 导航到景区信息管理
  navigateToScenicInfo: function() {
    wx.navigateTo({
      url: `/packageProfile/pages/privilege/merchant/scenic-info/scenic-info?userId=${this.data.userId}`
    });
  },

  // 导航到门票管理
  navigateToTicketManage: function() {
    wx.navigateTo({
      url: `/pages/ticket-manage/ticket-manage?userId=${this.data.userId}`
    });
  },

  // 导航到优惠方案管理
  navigateToDiscount: function() {
    wx.navigateTo({
      url: `/pages/discount/discount?userId=${this.data.userId}`
    });
  },


});