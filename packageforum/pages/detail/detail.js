Page({
  data: {

    //还需要优化
    post: {}, // 当前帖子详情
    comments: [], // 帖子的评论列表
    newComment: '', // 新评论内容
    currentPostId: null, // 当前展开评论的帖子 ID
    showCommentInput: false, // 控制评论输入框的显示
  },

  onLoad(options) {
    const postId = options.postId;
    this.setData({ currentPostId: postId });
    this.loadPost(postId);
    this.loadComments(postId);
  },

  // 加载帖子详情
  async loadPost(postId) {
    try {
      const res = await wx.cloud.database().collection('posts')
        .doc(postId)
        .get();
      const post = res.data;
      const likeCount = await this.getLikeCount(postId);
      const commentCount = await this.getCommentCount(postId);
      this.setData({ post: { ...post, likeCount, commentCount } });
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
    }
  },

  // 加载评论
  async loadComments(postId) {
    try {
      const comments = await wx.cloud.database().collection('comments')
        .where({ postId })
        .orderBy('createdAt', 'desc')
        .get();
      this.setData({ comments: comments.data });
    } catch (error) {
      console.error('加载评论失败:', error);
      wx.showToast({ title: '加载评论失败，请稍后重试', icon: 'none' });
    }
  },

  // 获取点赞数
  async getLikeCount(postId) {
    const res = await wx.cloud.database().collection('likes')
      .where({ postId })
      .count();
    return res.total;
  },

  // 获取评论数
  async getCommentCount(postId) {
    const res = await wx.cloud.database().collection('comments')
      .where({ postId })
      .count();
    return res.total;
  },

  // 点赞功能
  async handleLike(e) {
    const postId = e.currentTarget.dataset.postId;

    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId) {
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
      return;
    }

    const userId = loginState.userId; // 使用从 loginState 中获取的 userId

    try {
      const likeRecord = await wx.cloud.database().collection('likes')
        .where({ postId, userId })
        .get();

      if (likeRecord.data.length > 0) {
        await wx.cloud.database().collection('likes')
          .doc(likeRecord.data[0]._id)
          .remove();
      } else {
        await wx.cloud.database().collection('likes').add({
          data: { postId, userId, createdAt: new Date() },
        });
      }

      this.updateLikeCount(postId);
    } catch (error) {
      console.error('点赞失败:', error);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  // 更新点赞数
  async updateLikeCount(postId) {
    const likeCount = await this.getLikeCount(postId);
    const post = this.data.post;
    this.setData({ post: { ...post, likeCount } });
  },

  // 切换评论输入框显示
  toggleCommentSection() {
    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ showCommentInput: !this.data.showCommentInput });
  },

  // 隐藏评论输入框
  hideCommentInput() {
    this.setData({ showCommentInput: false });
  },

  // 阻止事件冒泡
  preventHide(e) {
    e.stopPropagation();
  },

  // 输入评论内容
  onCommentInput(e) {
    this.setData({ newComment: e.detail.value });
  },

  // 发表评论
  async handleComment(e) {
    const postId = e.currentTarget.dataset.postId;
    const content = this.data.newComment.trim();

    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    // 获取用户信息
    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId || !loginState.avatarUrl || !loginState.nickName) {
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
      return;
    }

    const { userId, avatarUrl, nickName } = loginState;

    try {
      await wx.cloud.database().collection('comments').add({
        data: { postId, userId, content, avatarUrl, nickName, createdAt: new Date() },
      });
      this.loadComments(postId);
      this.setData({ newComment: '', showCommentInput: false }); // 清空输入框并隐藏评论输入框
    } catch (error) {
      console.error('发表评论失败:', error);
      wx.showToast({ title: '发表评论失败，请稍后重试', icon: 'none' });
    }
  },

  // 检查用户是否登录
  checkLogin() {
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin;
  },

  // 格式化时间
  formatTime(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  },
});