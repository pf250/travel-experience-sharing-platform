App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-6gwm8q4ob467c403', // 替换为你的云开发环境 ID
    });
  }
});