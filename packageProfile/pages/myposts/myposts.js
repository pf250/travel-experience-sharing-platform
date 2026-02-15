// packageProfile/pages/myposts/myposts.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    posts: [], // 帖子列表
    userId: '', // 用户ID
    loading: true, // 加载状态
    empty: false // 空状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 接收从其他界面传递过来的userId参数
    if (options.userId) {
      // 将userId转换为数字类型，确保与数据库中存储的类型一致
      const userId = parseInt(options.userId);
      this.setData({ userId });
      this.loadUserPosts(userId);
    } else {
      // 没有传递userId参数，显示错误提示
      wx.showToast({ title: '缺少必要参数', icon: 'none' });
      this.setData({ loading: false, empty: true });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果已经有userId，则重新加载帖子
    if (this.data.userId) {
      // 确保userId是数字类型
      const userId = parseInt(this.data.userId);
      this.loadUserPosts(userId);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (this.data.userId) {
      // 确保userId是数字类型
      const userId = parseInt(this.data.userId);
      this.loadUserPosts(userId, true);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 加载用户发布的帖子
   */
  async loadUserPosts(userId, isPullRefresh = false) {
    try {
      if (!isPullRefresh) {
        this.setData({ loading: true, empty: false });
      }

      const posts = await wx.cloud.database().collection('posts')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get();

      // 格式化所有帖子的时间
      const formattedPosts = posts.data.map(post => {
        return {
          ...post,
          formattedTime: this.formatTime(post.createdAt)
        };
      });

      this.setData({
        posts: formattedPosts,
        loading: false,
        empty: formattedPosts.length === 0
      });

      if (isPullRefresh) {
        wx.stopPullDownRefresh();
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      this.setData({ loading: false, empty: true });
      if (isPullRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 跳转到帖子详情页
   */
  navigateToPostDetail(e) {
    const postId = e.currentTarget.dataset.postId;
    wx.navigateTo({
      url: `/packageforum/pages/detail/detail?postId=${postId}`
    });
  },

  /**
   * 删除帖子
   */
  deletePost(e) {
    const postId = e.currentTarget.dataset.postId;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇帖子吗？删除后将无法恢复，并且相关的评论和回复也会被删除。',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 显示删除中加载提示
            wx.showLoading({ title: '删除中...', mask: true });
            
            // 先删除与该帖子相关的所有评论和回复
            await this.deletePostComments(postId);
            
            // 然后删除帖子本身
            await wx.cloud.database().collection('posts')
              .doc(postId)
              .remove();
            
            // 隐藏加载提示
            wx.hideLoading();
            
            // 显示删除成功提示
            wx.showToast({ title: '删除成功', icon: 'success' });
            
            // 重新加载帖子列表
            if (this.data.userId) {
              const userId = parseInt(this.data.userId);
              this.loadUserPosts(userId);
            }
          } catch (error) {
            // 隐藏加载提示
            wx.hideLoading();
            
            console.error('删除帖子失败:', error);
            wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 删除与帖子相关的所有评论和回复
   */
  async deletePostComments(postId) {
    try {
      // 查询与该帖子相关的所有评论和回复
      const comments = await wx.cloud.database().collection('comments')
        .where({ postId })
        .get();
      
      // 遍历删除每个评论和回复
      for (const comment of comments.data) {
        await wx.cloud.database().collection('comments')
          .doc(comment._id)
          .remove();
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      throw error;
    }
  },

  /**
   * 格式化时间
   */
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
        if (diffMinutes < 1) {
          const diffSeconds = Math.floor(diff / 1000);
          return `${Math.max(1, diffSeconds)}秒前`;
        }
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
  }
})