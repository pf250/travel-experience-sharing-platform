// packageProfile/pages/privilege/admin/admin.js
Page({
  data: {
    menuItems: [
      {
        id: 'user',
        title: '用户管理',
        icon: 'user',
        path: '/packageProfile/pages/privilege/admin/user_manage/user_manage'
      },
      {
        id: 'merchant',
        title: '商家审核',
        icon: 'shop',
        path: '/packageProfile/pages/privilege/admin/merchant_mange/merchant_mange'
      },
      {
        id: 'scenic',
        title: '景区管理',
        icon: 'scenic',
        path: '/packageProfile/pages/privilege/admin/scenic_mange/scenic_mange'
      }
    ]
  },

  onLoad: function () {
  },

  // 跳转到对应页面
  navigateToPage: function (e) {
    const path = e.currentTarget.dataset.path;
    wx.navigateTo({
      url: path
    });
  }
});