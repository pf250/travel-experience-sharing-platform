Page({
  data: {
    avatarUrl: '',
    nickName: '',
    userId: '', // 初始值为空字符串
    title: '', // 标题内容
    description: '', // 描述内容
    images: [], // 图片数组，存储已上传的图片路径
    isLogin: false, // 登录状态
    // AI编辑相关状态
    showAIDialog: false, // AI编辑对话框显示状态
    aiScenicSpot: '', // AI编辑景点名字
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
    wx.showLoading({ 
      title,
      mask: true
    });
  },

  // 隐藏加载动画
  hideLoading() {
    try {
      wx.hideLoading();
    } catch (error) {
      // 忽略 hideLoading 可能的错误
      console.log('hideLoading error:', error);
    }
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

  // 显示AI编辑对话框
  showAIDialog() {
    this.setData({ showAIDialog: true });
  },

  // 隐藏AI编辑对话框
  hideAIDialog() {
    this.setData({ 
      showAIDialog: false,
      aiScenicSpot: '' // 清空输入
    });
  },

  // 处理景点名字输入
  onAIScenicSpotInput(e) {
    this.setData({ aiScenicSpot: e.detail.value.trim() });
  },

  // 调用AI模型生成内容
  async generateAIContent() {
    const { aiScenicSpot } = this.data;

    // 验证输入
    if (!aiScenicSpot.trim()) {
      this.showToast('请输入景点名字');
      return;
    }

    // 显示加载提示
    this.showLoading('AI生成中...');

    try {
      // 初始化AI模型
      const hy = wx.cloud.extend.AI.createModel('hunyuan-exp');

      // 构建提示词
      const prompt = `请为旅游景点"${aiScenicSpot}"生成一篇旅游攻略，包含以下内容：
1. 一个吸引人的标题（1-15字）
2. 一段详细的描述（50-150字），介绍景点的特色、历史文化、游览建议等

请严格按照以下格式输出：
标题：[生成的标题]
描述：[生成的描述]`; 

      // 调用AI模型
      const res = await hy.generateText({
        model: 'hunyuan-t1-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // 解析AI生成的内容
      const aiContent = res.choices[0].message.content;
      console.log('AI生成内容:', aiContent);

      // 提取标题和描述
      // 匹配不同格式的输出
      let title = '';
      let description = '';

      // 尝试匹配第一种格式：标题：[标题内容] 描述：[描述内容]
      const format1Match = aiContent.match(/标题：\[(.*?)\]\s*描述：\[(.*?)\]/s);
      if (format1Match) {
        title = format1Match[1].trim();
        description = format1Match[2].trim();
      } 
      // 尝试匹配第二种格式：标题：标题内容 描述：描述内容
      else {
        const format2Match = aiContent.match(/标题：([^描述]*)描述：(.*)/s);
        if (format2Match) {
          title = format2Match[1].trim();
          description = format2Match[2].trim();
        }
      }

      if (title && description) {
        // 将AI生成的数据放入输入栏和文本域
        this.setData({ title, description });

        // 显示成功提示
        this.showToast('AI生成成功', 'success');
      } else {
        // 解析失败，显示错误提示
        this.showToast('AI生成格式错误，请重试');
        console.log('解析失败的AI内容:', aiContent);
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      // 显示失败提示
      this.showToast('AI生成失败，请重试');
    } finally {
      // 隐藏加载提示
      this.hideLoading();
      // 隐藏对话框
      this.hideAIDialog();
    }
  },
});