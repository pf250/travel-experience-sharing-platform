// packageAI_agent/pages/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages: [], // 消息列表
    inputValue: '', // 输入框内容
    isLoading: false, // 加载状态
    showWelcome: true, // 是否显示欢迎消息
    userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder&image_size=square' // 用户头像
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化页面
    this.initPage();
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 可以在这里获取用户信息，设置用户头像等
    this.getUserInfo();
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    // 尝试获取用户信息
    wx.getUserProfile({
      desc: '用于显示用户头像',
      success: (res) => {
        this.setData({
          userAvatar: res.userInfo.avatarUrl
        });
      },
      fail: () => {
        // 获取失败时使用默认头像
        console.log('获取用户信息失败，使用默认头像');
      }
    });
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    console.log('输入内容变化:', e.detail.value);
    this.setData({
      inputValue: e.detail.value
    }, () => {
      console.log('inputValue更新后:', this.data.inputValue);
      console.log('按钮是否禁用:', !this.data.inputValue.trim());
    });
  },

  /**
   * 发送消息
   */
  onSendMessage() {
    console.log('发送按钮被点击');
    console.log('当前inputValue:', this.data.inputValue);
    const content = this.data.inputValue.trim();
    console.log('输入内容:', content);
    if (!content) {
      console.log('输入内容为空，不发送');
      return;
    }

    // 添加用户消息到列表
    const userMessage = {
      type: 'user',
      content: content
    };

    const newMessages = [...this.data.messages, userMessage];
    this.setData({
      messages: newMessages,
      inputValue: '',
      isLoading: true,
      showWelcome: false
    });

    console.log('消息发送成功，开始获取AI回复');
    // 调用AI接口获取回复
    this.getAIResponse(content);
  },

  /**
   * 获取AI回复
   */
  getAIResponse(content) {
    console.log('开始调用云函数');
    // 调用云函数获取AI回复
    wx.cloud.callFunction({
      name: 'aiService',
      data: {
        message: content
      },
      success: (res) => {
        console.log('云函数调用成功:', res);
        
        if (res.result && res.result.code === 0) {
          const aiResponse = res.result.data.response;
          console.log('AI回复:', aiResponse);
          
          // 添加AI回复到列表
          const aiMessage = {
            type: 'ai',
            content: aiResponse
          };

          const newMessages = [...this.data.messages, aiMessage];
          console.log('添加AI回复后的消息列表:', newMessages);
          this.setData({
            messages: newMessages,
            isLoading: false
          }, () => {
            console.log('AI回复setData完成');
            // 滚动到底部
            this.scrollToBottom();
          });
        } else {
          console.error('API调用失败:', res.result);
          // 显示错误信息
          const errorMessage = {
            type: 'ai',
            content: '抱歉，AI服务暂时不可用，请稍后再试。'
          };

          const newMessages = [...this.data.messages, errorMessage];
          this.setData({
            messages: newMessages,
            isLoading: false
          }, () => {
            console.log('错误信息setData完成');
            // 滚动到底部
            this.scrollToBottom();
          });
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        // 显示错误信息
        const errorMessage = {
          type: 'ai',
          content: '抱歉，网络连接失败，请稍后再试。'
        };

        const newMessages = [...this.data.messages, errorMessage];
        this.setData({
          messages: newMessages,
          isLoading: false
        }, () => {
          console.log('网络错误信息setData完成');
          // 滚动到底部
          this.scrollToBottom();
        });
      }
    });
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('#chatContent').boundingClientRect();
      query.select('#chatContent').scrollOffset();
      query.exec((res) => {
        if (res && res[0]) {
          const chatContent = wx.createSelectorQuery().select('#chatContent');
          chatContent.fields({
            scrollOffset: true,
            size: true
          }, function(rect) {
            wx.pageScrollTo({
              scrollTop: rect.scrollHeight,
              duration: 300
            });
          }).exec();
        }
      });
    }, 100);
  },

  /**
   * 返回按钮点击
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})