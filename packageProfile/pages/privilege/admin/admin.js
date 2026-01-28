// pages/admin-approve/admin-approve.js
Page({
  data: {
    applications: [],
    loading: true,
    tabIndex: 0, // 0:待审核, 1:已通过, 2:已拒绝
    tabs: ['待审核', '已通过', '已拒绝']
  },

  onLoad: function () {
    this.loadApplications();
  },

  onShow: function () {
    this.loadApplications();
  },

  // 切换标签页
  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      tabIndex: index,
      loading: true
    });
    this.loadApplications();
  },

  // 加载申请数据
  loadApplications: function () {
    const that = this;
    const db = wx.cloud.database();
    
    let whereCondition = {};
    
    // 根据当前标签设置筛选条件
    if (that.data.tabIndex === 0) {
      whereCondition.status = 'pending';
    } else if (that.data.tabIndex === 1) {
      whereCondition.status = 'approved';
    } else if (that.data.tabIndex === 2) {
      whereCondition.status = 'rejected';
    }
    
    db.collection('merchant_applications')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .get()
      .then((res) => {
        console.log('申请数据:', res.data);
        
        // 获取用户信息
        if (res.data.length > 0) {
          const userIds = res.data.map(item => item.userId);
          that.getUserInfo(userIds, res.data);
        } else {
          that.setData({
            applications: [],
            loading: false
          });
        }
      })
      .catch((err) => {
        console.error('加载申请失败:', err);
        that.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 获取用户信息
  getUserInfo: function (userIds, applications) {
    const that = this;
    const db = wx.cloud.database();
    
    db.collection('users')
      .where({
        userId: db.command.in(userIds)
      })
      .get()
      .then((res) => {
        const userMap = {};
        res.data.forEach(user => {
          userMap[user.userId] = {
            nickName: user.nickName,
            avatarUrl: user.avatarUrl
          };
        });
        
        // 合并数据
        const processedApplications = applications.map(app => {
          const userInfo = userMap[app.userId] || { nickName: '未知用户', avatarUrl: '' };
          return {
            ...app,
            ...userInfo,
            statusInfo: that.getStatusInfo(app.status),
            formattedTime: that.formatTime(app.createdAt),
            idPhotoUrl: '' // 初始化身份证照片URL
          };
        });
        
        that.setData({
          applications: processedApplications,
          loading: false
        });
        
        // 获取身份证照片的临时URL
        that.getPhotoUrls(processedApplications);
      })
      .catch((err) => {
        console.error('获取用户信息失败:', err);
        that.setData({ loading: false });
      });
  },

  // 获取照片临时URL
  getPhotoUrls: function (applications) {
    const that = this;
    
    applications.forEach((app, index) => {
      if (app.idPhoto) {
        wx.cloud.getTempFileURL({
          fileList: [app.idPhoto],
          success: (res) => {
            if (res.fileList && res.fileList[0]) {
              const key = `applications[${index}].idPhotoUrl`;
              that.setData({
                [key]: res.fileList[0].tempFileURL
              });
            }
          }
        });
      }
    });
  },

  // 同意申请
  approveApplication: function (e) {
    const id = e.currentTarget.dataset.id;
    const userId = e.currentTarget.dataset.userid;
    const that = this;
    
    wx.showModal({
      title: '确认操作',
      content: '确定要同意该商家的申请吗？',
      success: function (res) {
        if (res.confirm) {
          that.updateApplicationStatus(id, userId, 'approved', '已同意申请');
        }
      }
    });
  },

  // 拒绝申请
  rejectApplication: function (e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '确认操作',
      content: '确定要拒绝该商家的申请吗？',
      success: function (res) {
        if (res.confirm) {
          that.updateApplicationStatus(id, null, 'rejected', '已拒绝申请');
        }
      }
    });
  },

  // 更新申请状态
  updateApplicationStatus: function (id, userId, status, message) {
    const that = this;
    const db = wx.cloud.database();
    
    wx.showLoading({ title: '处理中...' });
    
    // 更新商家申请状态
    db.collection('merchant_applications').doc(id).update({
      data: {
        status: status,
        reviewedAt: new Date()
      }
    })
    .then(() => {
      // 如果是同意申请，还需要更新用户角色
      if (status === 'approved' && userId) {
        return db.collection('users').where({
          userId: userId
        }).update({
          data: {
            role: 'merchant'
          }
        });
      }
      return Promise.resolve();
    })
    .then(() => {
      wx.hideLoading();
      wx.showToast({
        title: message,
        icon: 'success'
      });
      
      // 刷新列表
      that.loadApplications();
    })
    .catch((err) => {
      wx.hideLoading();
      console.error('更新失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  // 查看大图
  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  // 获取状态信息
  getStatusInfo: function (status) {
    switch (status) {
      case 'pending':
        return { text: '待审核', color: '#ff9800', class: 'status-pending' };
      case 'approved':
        return { text: '已通过', color: '#4caf50', class: 'status-approved' };
      case 'rejected':
        return { text: '已拒绝', color: '#f44336', class: 'status-rejected' };
      default:
        return { text: '未知', color: '#9e9e9e', class: 'status-unknown' };
    }
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