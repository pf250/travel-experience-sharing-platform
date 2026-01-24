Page({
  data: {
    posts: [], // 帖子列表
    comments: [], // 当前帖子的评论列表
    currentPostId: null, // 当前展开评论的帖子 ID
    newComment: '', // 新评论内容
    hasMorePosts: true, // 是否还有更多帖子可以加载
    postPage: 1, // 当前帖子页码
    postPageSize: 5, // 每页加载的帖子数量
  },

  onLoad() {
    this.loadPosts();
  },

  // 下拉刷新事件
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ posts: [], postPage: 1, hasMorePosts: true }); // 重置数据
    this.loadPosts(); // 重新加载帖子列表
  },

  // 触底加载更多帖子
  onReachBottom() {
    if (this.data.hasMorePosts) {
      this.loadPosts();
    } else {
      wx.showToast({ title: '没有更多帖子了', icon: 'none' });
    }
  },

  // 加载帖子列表
  async loadPosts() {
    try {
      const { postPage, postPageSize } = this.data;
      const res = await wx.cloud.database().collection('posts')
        .orderBy('createdAt', 'desc') // 按时间倒序排列
        .skip((postPage - 1) * postPageSize) // 跳过已加载的帖子
        .limit(postPageSize) // 每次加载8条
        .get();

      if (res.data.length === 0) {
        this.setData({ hasMorePosts: false }); // 没有更多帖子了
        return;
      }

      // 获取每个帖子的点赞数和评论数
      const postsWithCounts = await Promise.all(
        res.data.map(async (post) => {
          const likeCount = await this.getLikeCount(post._id);
          const commentCount = await this.getCommentCount(post._id);
          return { ...post, likeCount, commentCount };
        })
      );

      this.setData({
        posts: [...this.data.posts, ...postsWithCounts], // 追加新加载的帖子
        postPage: postPage + 1, // 更新页码
      });

      wx.stopPullDownRefresh(); // 停止下拉刷新动画
    } catch (error) {
      console.error('加载帖子失败:', error);
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
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

    const userId = wx.getStorageSync('userId'); // 假设用户 ID 存储在本地缓存中
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
    const posts = this.data.posts.map((post) =>
      post._id === postId ? { ...post, likeCount } : post
    );
    this.setData({ posts });
  },

  // 展示评论
  showComments(e) {
    const postId = e.currentTarget.dataset.postId;

    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.loadComments(postId);
    this.setData({ currentPostId: postId });
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

    const userId = wx.getStorageSync('userId'); // 假设用户 ID 存储在本地缓存中
    try {
      await wx.cloud.database().collection('comments').add({
        data: { postId, userId, content, createdAt: new Date() },
      });
      this.loadComments(postId);
      this.setData({ newComment: '' }); // 清空输入框
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