// applications.js
Page({
  data: {
    userId: null,
    applications: [], // 申请记录列表
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
  },

  onLoad: function (options) {
    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId) {
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      userId: loginState.userId
    });

    this.loadApplications();
  },

  onShow: function () {
    if (this.data.userId) {
      this.setData({
        page: 1,
        applications: [],
        hasMore: true
      });
      this.loadApplications();
    }
  },

  // 加载申请记录
  loadApplications: function () {
    const that = this;
    const db = wx.cloud.database();
    
    this.setData({
      loading: true
    });

    db.collection('merchant_applications')
      .where({
        userId: that.data.userId
      })
      .orderBy('createdAt', 'desc')
      .skip((that.data.page - 1) * that.data.pageSize)
      .limit(that.data.pageSize)
      .get()
      .then((queryRes) => {
        console.log('查询到的申请记录:', queryRes.data);
        
        // 处理数据，添加状态信息
        const newApplications = (queryRes.data || []).map(item => {
          return {
            ...item,
            statusInfo: that.getStatusInfo(item.status), // 添加状态信息
            formattedTime: that.formatTime(item.createdAt) // 添加格式化时间
          };
        });
        
        const allApplications = that.data.page === 1 
          ? newApplications 
          : [...that.data.applications, ...newApplications];
        
        that.setData({
          applications: allApplications,
          loading: false,
          hasMore: newApplications.length === that.data.pageSize
        });
        
        if (newApplications.length > 0) {
          that.getPhotoUrls(newApplications);
        }
      })
      .catch((err) => {
        console.error('查询申请记录失败:', err);
        that.setData({
          loading: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 获取照片的临时URL
  getPhotoUrls: function (applications) {
    const that = this;
    
    applications.forEach((app, index) => {
      if (app.photo) {
        wx.cloud.getTempFileURL({
          fileList: [app.photo],
          success: (res) => {
            if (res.fileList && res.fileList[0]) {
              const appIndex = that.data.applications.findIndex(item => item._id === app._id);
              if (appIndex !== -1) {
                const key = `applications[${appIndex}].photoUrl`;
                that.setData({
                  [key]: res.fileList[0].tempFileURL
                });
              }
            }
          },
          fail: (err) => {
            console.error('获取照片URL失败:', err);
          }
        });
      }
    });
  },

  // 获取状态对应的文本和颜色
  getStatusInfo: function (status) {
    switch (status) {
      case 'pending':
        return { 
          text: '待审核', 
          color: '#FF9800', 
          bgColor: '#FFF3E0',
          className: 'status-pending'
        };
      case 'approved':
        return { 
          text: '已通过', 
          color: '#4CAF50', 
          bgColor: '#E8F5E9',
          className: 'status-approved'
        };
      case 'rejected':
        return { 
          text: '已拒绝', 
          color: '#F44336', 
          bgColor: '#FFEBEE',
          className: 'status-rejected'
        };
      default:
        return { 
          text: '未知', 
          color: '#9E9E9E', 
          bgColor: '#F5F5F5',
          className: 'status-unknown'
        };
    }
  },

  // 格式化时间
  formatTime: function (date) {
    if (!date) return '';
    
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date.$date) {
      // 处理云数据库的日期格式
      d = new Date(date.$date);
    } else {
      d = new Date(date);
    }
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 加载更多数据
  onReachBottom: function () {
    if (!this.data.loading && this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadApplications();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
      applications: [],
      hasMore: true
    });
    
    this.loadApplications();
    wx.stopPullDownRefresh();
  },

  // 查看大图
  previewImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const application = this.data.applications[index];
    
    if (application.photoUrl) {
      wx.previewImage({
        urls: [application.photoUrl],
        current: application.photoUrl
      });
    }
  }
});