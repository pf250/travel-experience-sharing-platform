// packageProfile/pages/privilege/merchant/discount/discount.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 优惠方案列表
    discounts: [],
    // 可用门票列表
    tickets: [],
    // 用户ID
    userId: '',
    // 景区ID
    scenicId: null,
    // 加载状态
    isLoading: true,
    // 弹窗状态
    showModal: false,
    // 当前年份、月份、日期
    currentYear: new Date().getFullYear(),
    currentMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    currentDay: new Date().getDate().toString().padStart(2, '0'),
    // 当前编辑的优惠方案
    currentDiscount: {
      title: '',
      discountValue: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      ticketIds: [],
      status: 0
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
      this.queryDiscounts();
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
          // 查询优惠方案和门票
          this.queryDiscounts();
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
   * 查询可用门票列表
   */
  queryTickets: function() {
    if (!this.data.scenicId) return;
    
    const db = wx.cloud.database();
    
    db.collection('ticket').where({
      scenicId: this.data.scenicId,
      status: 1
    }).get({
      success: (res) => {
        this.setData({
          tickets: res.data
        });
        console.log('查询门票成功:', res.data.length, '张');
      },
      fail: (err) => {
        console.error('查询门票失败:', err);
        if (err.errCode === -502005) {
          console.log('ticket集合不存在，将在添加门票时自动创建');
          this.setData({
            tickets: []
          });
        }
      }
    });
  },

  /**
   * 查询优惠方案列表
   */
  queryDiscounts: function() {
    if (!this.data.scenicId) return;
    
    const db = wx.cloud.database();
    
    this.setData({
      isLoading: true
    });
    
    db.collection('discounts').where({
      scenicId: this.data.scenicId
    }).get({
      success: (res) => {
        const discounts = res.data.map(discount => {
          // 计算优惠状态
          const now = new Date();
          // 解析开始时间
          const startParts = discount.startTime.split(/[- :]/);
          const startTime = new Date(startParts[0], startParts[1] - 1, startParts[2], startParts[3], startParts[4]);
          // 解析结束时间
          const endParts = discount.endTime.split(/[- :]/);
          const endTime = new Date(endParts[0], endParts[1] - 1, endParts[2], endParts[3], endParts[4]);
          
          let status = 0;
          if (now < startTime) {
            status = 0; // 未开始
          } else if (now >= startTime && now <= endTime) {
            status = 1; // 进行中
          } else {
            status = 2; // 已结束
          }
          
          // 获取适用门票名称
          const ticketNames = this.getTicketNames(discount.ticketIds);
          
          return {
            ...discount,
            status: status,
            ticketNames: ticketNames
          };
        });
        
        this.setData({
          discounts: discounts,
          isLoading: false
        });
        console.log('查询优惠方案成功:', discounts.length, '个');
      },
      fail: (err) => {
        console.error('查询优惠方案失败:', err);
        // 检查是否是集合不存在的错误
        if (err.errCode === -502005) {
          console.log('discounts集合不存在，将在添加优惠方案时自动创建');
          this.setData({
            discounts: [],
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          wx.showToast({
            title: '查询优惠方案失败',
            icon: 'error'
          });
        }
      }
    });
  },

  /**
   * 根据门票ID获取门票名称
   */
  getTicketNames: function(ticketIds) {
    if (!ticketIds || ticketIds.length === 0) {
      return '未设置';
    }
    
    const ticketNames = [];
    this.data.tickets.forEach(ticket => {
      if (ticketIds.includes(ticket._id)) {
        ticketNames.push(ticket.name);
      }
    });
    
    return ticketNames.join(', ');
  },

  /**
   * 显示添加优惠方案弹窗
   */
  showAddDiscountModal: function() {
    // 设置默认开始日期为当前日期
    const now = new Date();
    const defaultStartDate = now.toISOString().slice(0, 10);
    const defaultStartTime = '00:00';
    
    // 设置默认结束日期为当前时间加7天
    const defaultEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const defaultEndTime = '23:59';
    
    this.setData({
      showModal: true,
      currentDiscount: {
        title: '',
        discountValue: '',
        startDate: defaultStartDate,
        startTime: defaultStartTime,
        endDate: defaultEndDate,
        endTime: defaultEndTime,
        ticketIds: [],
        status: 0
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
   * 优惠类型变更
   */
  onDiscountTypeChange: function(e) {
    // 使用字符串类型，与radio的value属性类型一致
    const discountType = e.detail.value;
    this.setData({
      'currentDiscount.discountType': discountType
    });
    console.log('选择优惠类型:', discountType, '类型:', typeof discountType);
  },

  /**
   * 开始日期变更
   */
  onStartDateChange: function(e) {
    this.setData({
      'currentDiscount.startDate': e.detail.value
    });
    console.log('选择开始日期:', e.detail.value);
  },

  /**
   * 开始时间变更
   */
  onStartTimeChange: function(e) {
    this.setData({
      'currentDiscount.startTime': e.detail.value
    });
    console.log('选择开始时间:', e.detail.value);
  },

  /**
   * 结束日期变更
   */
  onEndDateChange: function(e) {
    this.setData({
      'currentDiscount.endDate': e.detail.value
    });
    console.log('选择结束日期:', e.detail.value);
  },

  /**
   * 结束时间变更
   */
  onEndTimeChange: function(e) {
    this.setData({
      'currentDiscount.endTime': e.detail.value
    });
    console.log('选择结束时间:', e.detail.value);
  },

  /**
   * 门票选择变更
   */
  onTicketSelect: function(e) {
    // 使用checkbox-group后，e.detail.value会是一个数组，包含所有选中的checkbox的value值
    const selectedTicketIds = e.detail.value || [];
    
    console.log('Checkbox-group事件:', e);
    console.log('选中的门票ID数组:', selectedTicketIds);
    
    // 直接更新currentDiscount.ticketIds为选中的门票ID数组
    this.setData({
      'currentDiscount.ticketIds': selectedTicketIds
    });
    
    console.log('当前选择的门票:', selectedTicketIds);
  },

  /**
   * 表单验证
   */
  validateForm: function(discount) {
    if (!discount.title || discount.title.trim() === '') {
      wx.showToast({
        title: '请输入优惠标题',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.discountValue || isNaN(discount.discountValue) || Number(discount.discountValue) <= 0) {
      wx.showToast({
        title: '请输入正确的优惠值',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.startDate) {
      wx.showToast({
        title: '请选择开始日期',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.startTime) {
      wx.showToast({
        title: '请选择开始时间',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.endDate) {
      wx.showToast({
        title: '请选择结束日期',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.endTime) {
      wx.showToast({
        title: '请选择结束时间',
        icon: 'none'
      });
      return false;
    }
    
    // 组合日期和时间进行比较（使用iOS支持的格式）
    const startDateTimeStr = discount.startDate.replace(/-/g, '/') + ' ' + discount.startTime + ':00';
    const endDateTimeStr = discount.endDate.replace(/-/g, '/') + ' ' + discount.endTime + ':00';
    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);
    
    if (startDateTime >= endDateTime) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      });
      return false;
    }
    
    if (!discount.ticketIds || discount.ticketIds.length === 0) {
      wx.showToast({
        title: '请选择适用门票',
        icon: 'none'
      });
      return false;
    }
    
    // 验证直减金额不大于选中门票的最低价格
    const selectedTickets = this.data.tickets.filter(ticket => discount.ticketIds.includes(ticket._id));
    if (selectedTickets.length > 0) {
      const minPrice = Math.min(...selectedTickets.map(ticket => ticket.price));
      if (Number(discount.discountValue) > minPrice) {
        wx.showToast({
          title: '直减金额不能大于门票原价',
          icon: 'none'
        });
        return false;
      }
    }
    
    // 验证所选门票是否已经有其他优惠方案
    const db = wx.cloud.database();
    const startTime = discount.startDate + ' ' + discount.startTime;
    const endTime = discount.endDate + ' ' + discount.endTime;
    
    // 解析时间格式
    const startParts = startTime.split(/[- :]/);
    const newStartTime = new Date(startParts[0], startParts[1] - 1, startParts[2], startParts[3], startParts[4]);
    const endParts = endTime.split(/[- :]/);
    const newEndTime = new Date(endParts[0], endParts[1] - 1, endParts[2], endParts[3], endParts[4]);
    
    // 检查是否有重叠的优惠方案
    for (const existingDiscount of this.data.discounts) {
      // 解析现有优惠的时间
      const existingStartParts = existingDiscount.startTime.split(/[- :]/);
      const existingStartTime = new Date(existingStartParts[0], existingStartParts[1] - 1, existingStartParts[2], existingStartParts[3], existingStartParts[4]);
      const existingEndParts = existingDiscount.endTime.split(/[- :]/);
      const existingEndTime = new Date(existingEndParts[0], existingEndParts[1] - 1, existingEndParts[2], existingEndParts[3], existingEndParts[4]);
      
      // 检查时间是否重叠
      const timeOverlap = !(newEndTime <= existingStartTime || newStartTime >= existingEndTime);
      
      // 检查是否有共同的门票
      const commonTickets = discount.ticketIds.filter(ticketId => existingDiscount.ticketIds.includes(ticketId));
      
      if (timeOverlap && commonTickets.length > 0) {
        wx.showToast({
          title: '所选门票在该时间段内已有其他优惠方案',
          icon: 'none'
        });
        return false;
      }
    }
    
    return true;
  },

  /**
   * 保存优惠方案
   */
  saveDiscount: function(e) {
    const discountData = e.detail.value;
    const currentDiscount = this.data.currentDiscount;
    
    console.log('当前选择的门票:', currentDiscount.ticketIds);
    
    const discount = {
      ...currentDiscount,
      ...discountData,
      discountType: 1,
      discountValue: Number(discountData.discountValue),
      ticketIds: currentDiscount.ticketIds
    };
    
    // 表单验证
    if (!this.validateForm(discount)) {
      return;
    }
    
    // 组合日期和时间
    const startTime = discount.startDate + ' ' + discount.startTime;
    const endTime = discount.endDate + ' ' + discount.endTime;
    
    const db = wx.cloud.database();
    const discountToSave = {
      title: discount.title,
      discountType: 1,
      discountValue: discount.discountValue,
      startTime: startTime,
      endTime: endTime,
      ticketIds: discount.ticketIds,
      scenicId: this.data.scenicId,
      updatedAt: db.serverDate()
    };
    
    wx.showLoading({
      title: '保存中...',
    });
    
    // 添加新优惠方案
    discountToSave.createdAt = db.serverDate();
    
    db.collection('discounts').add({
      data: discountToSave,
      success: () => {
        wx.hideLoading();
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        this.hideModal();
        this.queryDiscounts();
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '添加失败',
          icon: 'error'
        });
        console.error('添加优惠方案失败:', err);
      }
    });
  },

  /**
   * 删除优惠方案
   */
  deleteDiscount: function(e) {
    const discountId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个优惠方案吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          
          wx.showLoading({
            title: '删除中...',
          });
          
          db.collection('discounts').doc(discountId).remove({
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.queryDiscounts();
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
              console.error('删除优惠方案失败:', err);
            }
          });
        }
      }
    });
  }
})