Page({
  data: {
    posts: [], // 帖子列表
    hasMorePosts: true, // 是否还有更多帖子可以加载
    postPage: 1, // 当前帖子页码
    postPageSize: 5, // 每页加载的帖子数量
  },

  onLoad() {
    this.loadPosts();
  },

  onShow() {
    // 每次页面显示时都刷新数据
    this.setData({ posts: [], postPage: 1, hasMorePosts: true }); // 重置数据
    this.loadPosts(); // 重新加载帖子列表
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
        .limit(postPageSize) // 每次加载5条
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
          const formattedTime = this.formatTime(post.createdAt);
          return { ...post, likeCount, commentCount, formattedTime };
        })
      );

      // 确保没有重复的帖子
      const newPosts = postsWithCounts.filter(newPost => 
        !this.data.posts.some(existingPost => existingPost._id === newPost._id)
      );

      this.setData({
        posts: [...this.data.posts, ...newPosts], // 追加新加载的帖子
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

  // 检查用户是否登录
  checkLogin() {
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin;
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return '';
    
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date.$date) {
      d = new Date(date.$date);
    } else {
      d = new Date(date);
    }
    
    const now = new Date();
    const diff = now - d;
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    
    // 如果是24小时内，显示相对时间
    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diff / (1000 * 60));
        return `${diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    }
    
    // 计算日期差值
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((nowDate - targetDate) / (1000 * 60 * 60 * 24));
    
    // 根据日期差值显示不同格式
    if (diffDays === 1) {
      return '昨天';
    } else if (diffDays === 2) {
      return '前天';
    } else if (diffDays <= 7) {
      return `${diffDays}天前`;
    } else {
      // 超过7天，显示具体的月和日
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${month}-${day}`;
    }
  },

  // 导航到详情页面
  navigateToDetail(e) {
    const postId = e.currentTarget.dataset.postId;
    wx.navigateTo({
      url: `/packageforum/pages/detail/detail?postId=${postId}`,
    });
  },
});