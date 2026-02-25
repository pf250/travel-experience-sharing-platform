// packageProfile/pages/privilege/admin/user_manage/user_manage.js
Page({
  data: {
    users: [],
    loading: true,
    tabIndex: 0, // 0:全部用户, 1:普通用户, 2:商家
    tabs: ['全部用户', '普通用户', '商家']
  },

  onLoad: function () {
    this.loadUsers();
  },

  onShow: function () {
    // 移除自动加载，避免从其他页面返回时重新加载数据
  },

  // 切换标签页
  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      tabIndex: index,
      loading: true
    });
    this.loadUsers();
  },

  // 加载用户数据
  loadUsers: function () {
    const that = this;
    const db = wx.cloud.database();
    
    let whereCondition = {};
    
    // 根据当前标签设置筛选条件
    if (that.data.tabIndex === 1) {
      whereCondition.role = 'user';
    } else if (that.data.tabIndex === 2) {
      whereCondition.role = 'merchant';
    }
    
    db.collection('users')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .get()
      .then((res) => {
        console.log('用户数据:', res.data);
        
        const processedUsers = res.data.map(user => ({
          ...user,
          formattedTime: that.formatTime(user.createdAt),
          roleText: user.role === 'admin' ? '管理员' : user.role === 'merchant' ? '商家' : '普通用户'
        }));
        
        that.setData({
          users: processedUsers,
          loading: false
        });
      })
      .catch((err) => {
        console.error('加载用户失败:', err);
        that.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 格式化时间
  formatTime: function (date) {
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
    
    // 超过24小时，显示具体日期
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});