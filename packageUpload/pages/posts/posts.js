Page({
  data: {
    avatarUrl: '',
    nickName: '',
    userId: '', // 初始值为空字符串
    title: '', // 标题内容
    description: '', // 描述内容
    images: [], // 图片数组，存储已上传的图片路径
    isLogin: false, // 登录状态
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const loginState = wx.getStorageSync('loginState');
    if (loginState && loginState.isLogin && loginState.userId) {
      this.setData({
        isLogin: true,
        avatarUrl: loginState.avatarUrl,
        nickName: loginState.nickName,
        userId: Number(loginState.userId), // 将 userId 转换为数字类型
      });
    } else {
      console.warn('用户未登录或 userId 无效');
      this.showToast('请先登录');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 1000);
    }
  },

  // 检查登录状态
  checkLogin() {
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin;
  },

  // 显示提示信息
  showToast(title, icon = 'none') {
    wx.showToast({ title, icon });
  },

  // 显示加载动画
  showLoading(title = '加载中...') {
    wx.showLoading({ title });
  },

  // 隐藏加载动画
  hideLoading() {
    wx.hideLoading();
  },

  // 监听标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value.trim() });
  },

  // 监听描述输入
  onDescInput(e) {
    this.setData({ description: e.detail.value.trim() });
  },

  // 选择图片并上传
  chooseImage() {
    const { images } = this.data;
    const maxImages = 4;
    if (images.length >= maxImages) {
      this.showToast(`最多只能选择 ${maxImages} 张图片`);
      return;
    }
    wx.chooseImage({
      count: maxImages - images.length,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: ({ tempFilePaths }) => {
        this.setData({ images: [...images, ...tempFilePaths] });
      },
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 发布内容
  async handlePublish() {
    const { title, description, images, userId } = this.data;

    // 数据校验
    if (!title.trim()) {
      this.showToast('请输入标题');
      return;
    }
    if (!description.trim()) {
      this.showToast('请输入描述');
      return;
    }
    if (!this.checkLogin()) {
      this.showToast('请先登录');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 1000);
      return;
    }

    // 检查 userId 是否有效
    if (!userId) {
      this.showToast('用户 ID 无效，请重新登录');
      return;
    }

    // 开始发布流程
    this.showLoading('发布中...');
    
    try {
      // 上传图片到云存储
      const uploadPromises = images.map((imagePath, idx) =>
        wx.cloud.uploadFile({
          cloudPath: `posts/user_${userId || 'unknown'}_${Date.now()}.jpg`, // 添加默认值保护
          filePath: imagePath,
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map(result => result.fileID);

      // 将信息发布到云数据库
      await wx.cloud.database().collection('posts').add({
        data: {
          avatarUrl: this.data.avatarUrl,
          nickName: this.data.nickName,
          title,
          description,
          images: imageUrls,
          userId,
          createdAt: new Date(),
        },
      });

      // 发布成功后的处理
      this.handleSuccess();
    } catch (error) {
      console.error('发布失败:', error);
      this.handleError();
    }
  },

  // 处理发布成功后的逻辑
  handleSuccess() {
    this.hideLoading();
    // 显示成功提示
    this.showToast('发布成功', 'success');
    // 清空表单数据
    this.setData({
      title: '',
      description: '',
      images: [],
    });
    // 延迟 1.5 秒后返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1, // 返回上一页
      });
    }, 1500);
  },

  // 处理发布失败后的逻辑
  handleError() {
    this.hideLoading();
    // 显示失败提示
    this.showToast('发布失败，请重试');
  },
});