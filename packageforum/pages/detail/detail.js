Page({
  data: {

    //还需要优化
    post: {}, // 当前帖子详情
    comments: [], // 帖子的评论列表
    newComment: '', // 新评论内容
    currentPostId: null, // 当前展开评论的帖子 ID
    showCommentInput: false, // 控制评论输入框的显示
    // 回复相关状态
    showReplyInput: false, // 控制回复输入框的显示
    replyTargetId: null, // 回复目标评论的 ID
    replyTargetAuthor: '', // 回复目标评论的作者昵称
    newReply: '', // 新回复内容
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
      const formattedTime = this.formatTime(post.createdAt);
      this.setData({ post: { ...post, likeCount, commentCount, formattedTime } });
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
      
      // 格式化所有评论的时间
      const allComments = comments.data.map(comment => {
        return {
          ...comment,
          formattedTime: this.formatTime(comment.createdAt),
          replies: []
        };
      });
      
      // 构建评论-回复的层级结构
      const topLevelComments = [];
      const replyMap = {};
      
      // 首先创建所有评论的映射
      allComments.forEach(comment => {
        replyMap[comment._id] = comment;
      });
      
      // 然后构建层级
      allComments.forEach(comment => {
        if (!comment.parentId) {
          // 顶级评论
          topLevelComments.push(comment);
        } else {
          // 回复评论
          const parentComment = replyMap[comment.parentId];
          if (parentComment) {
            parentComment.replies.push(comment);
          }
        }
      });
      
      this.setData({ comments: topLevelComments });
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

  // 显示回复输入框
  showReplyInput(e) {
    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const commentId = e.currentTarget.dataset.commentId;
    const commentAuthor = e.currentTarget.dataset.commentAuthor;
    this.setData({
      showReplyInput: true,
      replyTargetId: commentId,
      replyTargetAuthor: commentAuthor,
      newReply: ''
    });
  },

  // 隐藏回复输入框
  hideReplyInput() {
    this.setData({
      showReplyInput: false,
      replyTargetId: null,
      replyTargetAuthor: '',
      newReply: ''
    });
  },

  // 输入回复内容
  onReplyInput(e) {
    this.setData({ newReply: e.detail.value });
  },

  // 发表回复
  async handleReply(e) {
    const postId = this.data.currentPostId;
    const parentId = e.currentTarget.dataset.commentId;
    const content = this.data.newReply.trim();

    if (!this.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (!content) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' });
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
        data: { postId, userId, content, avatarUrl, nickName, parentId, createdAt: new Date() },
      });
      this.loadComments(postId);
      this.hideReplyInput(); // 清空输入框并隐藏回复输入框
    } catch (error) {
      console.error('发表回复失败:', error);
      wx.showToast({ title: '发表回复失败，请稍后重试', icon: 'none' });
    }
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
});