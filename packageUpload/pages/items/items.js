Page({
  data: {
    avatarUrl: '',
    nickName: '',
    userId: '', // 初始值为空字符串
    description: '', // 宝贝描述
    price: '', // 价格
    locationOptions: ['慧园', '庠园', '智园', '校外'], // 地点选项
    locationIndex: null, // 当前选中的地点索引
    images: [], // 图片列表
    categories: ['数码', '书籍', '服装', '美妆', '游戏', '家居生活', '体育用品', '其他'], // 分类选项
    categoryIndex: null, // 当前选中的分类索引
    shippingOptions: ['包邮', '自提'], // 发货方式选项
    shippingIndex: null, // 当前选中的发货方式索引
  },
  
  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const loginState = wx.getStorageSync('loginState');
    if (loginState && loginState.isLogin) {
      this.setData({
        isLogin: true,
        avatarUrl: loginState.avatarUrl,
        nickName: loginState.nickName,
        userId: Number(loginState.userId) // 将 userId 转换为数字类型
      });
    }
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 输入价格
  onPriceInput(e) {
    // 只允许输入数字和小数点，且小数点只能出现一次
    let value = e.detail.value;
    // 移除非数字和小数点的字符
    value = value.replace(/[^0-9.]/g, '');
    // 确保小数点只出现一次
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // 限制小数点后最多两位
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    this.setData({ price: value });
  },

  // 选择地点
  onLocationChange(e) {
    const index = e.detail.value;
    this.setData({ locationIndex: index });
  },

  // 选择分类
  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value });
  },

  // 选择发货方式
  onShippingChange(e) {
    this.setData({ shippingIndex: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    const maxCount = 4 - this.data.images.length;
    wx.chooseImage({
      count: maxCount,
      success: (res) => {
        const newImages = this.data.images.concat(res.tempFilePaths);
        this.setData({ images: newImages });
      },
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newImages = this.data.images.filter((_, i) => i !== index);
    this.setData({ images: newImages });
  },

  // 发布按钮
  handlePublish() {
    // 检查是否登录
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
  
    // 获取表单数据
    const { description, price, locationIndex, categoryIndex, shippingIndex, images } = this.data;
  
    // 检查表单是否填写完整
    if (!description || !price || locationIndex === null || categoryIndex === null || shippingIndex === null) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none',
      });
      return;
    }

    // 检查价格是否为有效的数字，并且大于0
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      wx.showToast({
        title: '请输入有效的价格',
        icon: 'none',
      });
      return;
    }
  
    // 显示发布中的加载提示
    wx.showLoading({
      title: '发布中...',
    });
  
    // 获取用户信息
    const { avatarUrl, nickName, userId } = this.data;
  
    // 将图片上传到云存储
    const uploadPromises = images.map(imagePath => {
      return wx.cloud.uploadFile({
        cloudPath: `items/user_${this.data.userId}_${Date.now()}.jpg`, // 文件名
        filePath: imagePath, // 本地文件路径
      });
    });
  
    // 执行图片上传
    Promise.all(uploadPromises)
      .then(uploadResults => {
        // 获取图片的云端路径
        const imageUrls = uploadResults.map(result => result.fileID);
  
        // 将商品信息发布到云数据库
        return wx.cloud.database().collection('items').add({
          data: {
            description,
            price: parseFloat(price), // 确保价格是数字类型
            location: this.data.locationOptions[locationIndex], // 地点
            category: this.data.categories[categoryIndex], // 分类
            shipping: this.data.shippingOptions[shippingIndex], // 发货方式
            images: imageUrls, // 图片链接
            userId: Number(userId), // 确保 userId 是数字类型
            userNickname: nickName, // 冗余存储昵称
            userAvatar: avatarUrl, // 冗余存储头像
            createdAt: new Date(), // 创建时间
          },
        });
      })
      .then(() => {
        // 隐藏加载提示
        wx.hideLoading();
  
        // 发布成功提示
        wx.showToast({
          title: '发布成功',
          icon: 'success',
        });
  
        // 清空表单
        this.setData({
          description: '',
          price: '',
          locationIndex: null,
          images: [],
          categoryIndex: null,
          shippingIndex: null,
        });
  
        // 发布成功后返回上一页
        setTimeout(() => {
          wx.navigateBack({
            delta: 1, // 返回上一页
          });
        }, 1500); // 1.5秒后返回上一页
      })
      .catch(err => {
        console.error("发布失败", err);
        // 隐藏加载提示
        wx.hideLoading();
  
        // 发布失败提示
        wx.showToast({
          title: '发布失败，请重试',
          icon: 'none',
        });
      });
  },

  // 检查登录状态的方法
  checkLogin() {
    // 从本地缓存中获取登录状态
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin; // 如果有登录状态且 isLogin 为 true，则返回 true
  },
});