// packageProfile/pages/privilege/merchant/ticket-manage/ticket-manage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 门票列表
    tickets: [],
    // 用户ID
    userId: '',
    // 景区ID
    scenicId: null,
    // 加载状态
    isLoading: true,
    // 弹窗状态
    showModal: false,
    // 是否编辑模式
    isEditMode: false,
    // 当前编辑的门票
    currentTicket: {
      name: '',
      price: '',
      description: '',
      stock: '',
      status: 1
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.userId) {
      this.setData({
        userId: options.userId
      });
      
      // 获取用户对应的景区ID
      this.getScenicIdByUserId(options.userId);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.scenicId) {
      this.queryTickets();
    }
  },

  /**
   * 根据用户ID获取景区ID
   */
  getScenicIdByUserId: function(userId) {
    const db = wx.cloud.database();
    
    db.collection('scenic').where({
      userId: Number(userId)
    }).get({
      success: (res) => {
        if (res.data && res.data.length > 0) {
          this.setData({
            scenicId: res.data[0]._id
          });
          // 查询门票列表
          this.queryTickets();
        } else {
          wx.showToast({
            title: '请先创建景区',
            icon: 'none'
          });
          this.setData({
            isLoading: false
          });
        }
      },
      fail: (err) => {
        console.error('获取景区ID失败:', err);
        this.setData({
          isLoading: false
        });
      }
    });
  },

  /**
   * 查询门票列表
   */
  queryTickets: function() {
    if (!this.data.scenicId) return;
    
    const db = wx.cloud.database();
    
    this.setData({
      isLoading: true
    });
    
    db.collection('ticket').where({
      scenicId: this.data.scenicId
    }).get({
      success: (res) => {
        this.setData({
          tickets: res.data,
          isLoading: false
        });
        console.log('查询门票成功:', res.data.length, '张');
      },
      fail: (err) => {
        console.error('查询门票失败:', err);
        // 检查是否是集合不存在的错误
        if (err.errCode === -502005) {
          console.log('ticket集合不存在，将在添加门票时自动创建');
          this.setData({
            tickets: [],
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          wx.showToast({
            title: '查询门票失败',
            icon: 'error'
          });
        }
      }
    });
  },

  /**
   * 显示添加门票弹窗
   */
  showAddTicketModal: function() {
    this.setData({
      showModal: true,
      isEditMode: false,
      currentTicket: {
        name: '',
        price: '',
        description: '',
        stock: '',
        status: 1
      }
    });
  },

  /**
   * 显示编辑门票弹窗
   */
  showEditTicketModal: function(e) {
    const ticket = e.currentTarget.dataset.ticket;
    this.setData({
      showModal: true,
      isEditMode: true,
      currentTicket: {
        ...ticket
      }
    });
  },

  /**
   * 隐藏弹窗
   */
  hideModal: function() {
    this.setData({
      showModal: false
    });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  /**
   * 表单验证
   */
  validateForm: function(ticket) {
    if (!ticket.name || ticket.name.trim() === '') {
      wx.showToast({
        title: '请输入门票名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!ticket.price || isNaN(ticket.price) || Number(ticket.price) <= 0) {
      wx.showToast({
        title: '请输入正确的价格',
        icon: 'none'
      });
      return false;
    }
    
    if (!ticket.stock || isNaN(ticket.stock) || Number(ticket.stock) < 0) {
      wx.showToast({
        title: '请输入正确的库存',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  /**
   * 保存门票
   */
  saveTicket: function(e) {
    const ticketData = e.detail.value;
    
    // 表单验证
    if (!this.validateForm(ticketData)) {
      return;
    }
    
    const db = wx.cloud.database();
    const ticket = {
      ...ticketData,
      scenicId: this.data.scenicId,
      price: Number(ticketData.price),
      stock: Number(ticketData.stock),
      status: 1,
      updatedAt: db.serverDate()
    };
    
    wx.showLoading({
      title: '保存中...',
    });
    
    if (this.data.isEditMode) {
      // 更新现有门票
      db.collection('ticket').doc(this.data.currentTicket._id).update({
        data: ticket,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          this.hideModal();
          this.queryTickets();
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '更新失败',
            icon: 'error'
          });
          console.error('更新门票失败:', err);
        }
      });
    } else {
      // 添加新门票
      ticket.createdAt = db.serverDate();
      
      db.collection('ticket').add({
        data: ticket,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.hideModal();
          this.queryTickets();
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '添加失败',
            icon: 'error'
          });
          console.error('添加门票失败:', err);
        }
      });
    }
  },

  /**
   * 更新门票状态（上下架）
   */
  updateTicketStatus: function(e) {
    const ticketId = e.currentTarget.dataset.id;
    const status = Number(e.currentTarget.dataset.status);
    
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '更新中...',
    });
    
    db.collection('ticket').doc(ticketId).update({
      data: {
        status: status,
        updatedAt: db.serverDate()
      },
      success: () => {
        wx.hideLoading();
        wx.showToast({
          title: status === 1 ? '上架成功' : '下架成功',
          icon: 'success'
        });
        this.queryTickets();
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
        console.error('更新状态失败:', err);
      }
    });
  },

  /**
   * 删除门票
   */
  deleteTicket: function(e) {
    const ticketId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张门票吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          
          wx.showLoading({
            title: '删除中...',
          });
          
          db.collection('ticket').doc(ticketId).remove({
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.queryTickets();
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
              console.error('删除门票失败:', err);
            }
          });
        }
      }
    });
  }
})