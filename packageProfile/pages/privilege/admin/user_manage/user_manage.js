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
        
        // 检查并更新过期的禁言状态
        const updatePromises = [];
        const processedUsers = res.data.map(user => {
          const isSilenced = user.isSilenced && user.silenceEndTime && new Date(user.silenceEndTime) > new Date();
          const silenceEndTimeFormatted = user.silenceEndTime ? that.formatTime(user.silenceEndTime) : '';
          
          // 如果用户被禁言但已过期，自动解除禁言
          if (user.isSilenced && user.silenceEndTime && new Date(user.silenceEndTime) <= new Date()) {
            updatePromises.push(
              db.collection('users').where({
                userId: user.userId
              }).update({
                data: {
                  isSilenced: false,
                  silenceEndTime: null,
                  silenceReason: ''
                }
              })
            );
          }
          
          return {
            ...user,
            formattedTime: that.formatTime(user.createdAt),
            roleText: user.role === 'admin' ? '管理员' : user.role === 'merchant' ? '商家' : '普通用户',
            isSilenced: isSilenced,
            silenceEndTimeFormatted: silenceEndTimeFormatted
          };
        });
        
        // 执行所有过期禁言的更新操作
        if (updatePromises.length > 0) {
          Promise.all(updatePromises)
            .then(() => {
              console.log('自动解除过期禁言成功');
              // 重新加载用户数据，以获取更新后的状态
              that.loadUsers();
            })
            .catch((err) => {
              console.error('自动解除过期禁言失败:', err);
            });
        } else {
          that.setData({
            users: processedUsers,
            loading: false
          });
        }
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

  // 禁言用户
  silenceUser: function (e) {
    const userId = e.currentTarget.dataset.userid;
    const that = this;
    
    // 禁言时间选项（单位：小时）
    const silenceOptions = [
      { label: '1小时', value: 1 },
      { label: '6小时', value: 6 },
      { label: '12小时', value: 12 },
      { label: '24小时', value: 24 },
      { label: '7天', value: 168 },
      { label: '30天', value: 720 }
    ];
    
    wx.showActionSheet({
      itemList: silenceOptions.map(option => option.label),
      success: function (res) {
        const selectedOption = silenceOptions[res.tapIndex];
        const silenceHours = selectedOption.value;
        const silenceEndTime = new Date(Date.now() + silenceHours * 60 * 60 * 1000);
        
        // 显示输入禁言原因的弹窗
        wx.showModal({
          title: '禁言用户',
          content: `确定要禁言该用户${selectedOption.label}吗？`,
          editable: true,
          placeholderText: '请输入禁言原因',
          success: function (reasonRes) {
            if (reasonRes.confirm) {
              const silenceReason = reasonRes.content || '违反社区规范';
              that.updateSilenceStatus(userId, true, silenceEndTime, silenceReason);
            }
          }
        });
      }
    });
  },

  // 解除禁言
  unsilenceUser: function (e) {
    const userId = e.currentTarget.dataset.userid;
    const that = this;
    
    wx.showModal({
      title: '解除禁言',
      content: '确定要解除该用户的禁言吗？',
      success: function (res) {
        if (res.confirm) {
          that.updateSilenceStatus(userId, false, null, '');
        }
      }
    });
  },

  // 更新禁言状态
  updateSilenceStatus: function (userId, isSilenced, silenceEndTime, silenceReason) {
    const that = this;
    const db = wx.cloud.database();
    
    wx.showLoading({ title: '处理中...' });
    
    // 准备更新数据
    const updateData = {
      isSilenced: isSilenced
    };
    
    if (isSilenced) {
      updateData.silenceEndTime = silenceEndTime;
      updateData.silenceReason = silenceReason;
    } else {
      updateData.silenceEndTime = null;
      updateData.silenceReason = '';
    }
    
    // 更新用户禁言状态
    db.collection('users').where({
      userId: userId
    }).update({
      data: updateData
    })
    .then(() => {
      wx.hideLoading();
      wx.showToast({
        title: isSilenced ? '禁言成功' : '解除禁言成功',
        icon: 'success'
      });
      
      // 刷新列表
      that.loadUsers();
    })
    .catch((err) => {
      wx.hideLoading();
      console.error('更新禁言状态失败:', err);
      wx.showToast({
        title: '操作失败',
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