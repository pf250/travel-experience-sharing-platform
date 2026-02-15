// pages/attraction/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scenic: null,
    tickets: [],
    discounts: [],
    isLoading: true,
    currentImageIndex: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const scenicId = options.id;
    if (scenicId) {
      this.queryScenicDetail(scenicId);
      this.queryTicketsByScenicId(scenicId);
      this.queryDiscountsByScenicId(scenicId);
    }
  },

  /**
   * 查询景区详情
   */
  queryScenicDetail(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('scenic').doc(scenicId).get({
      success: (res) => {
        this.setData({
          scenic: res.data
        });
        console.log('查询景区详情成功:', res.data);
        this.setLoading(false);
      },
      fail: (err) => {
        console.error('查询景区详情失败:', err);
        wx.showToast({
          title: '加载景区信息失败',
          icon: 'error'
        });
        this.setLoading(false);
      }
    });
  },

  /**
   * 根据景区ID查询门票
   */
  queryTicketsByScenicId(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('ticket').where({
      scenicId: scenicId,
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
      }
    });
  },

  /**
   * 根据景区ID查询优惠方案
   */
  queryDiscountsByScenicId(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('discounts').where({
      scenicId: scenicId
    }).get({
      success: (res) => {
        // 计算优惠状态
        const now = new Date();
        const discountsWithStatus = res.data.map(discount => {
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
          
          return {
            ...discount,
            status: status
          };
        });
        
        this.setData({
          discounts: discountsWithStatus
        });
        console.log('查询优惠方案成功:', discountsWithStatus.length, '个');
        
        // 为门票添加优惠信息
        this.addDiscountInfoToTickets();
      },
      fail: (err) => {
        console.error('查询优惠方案失败:', err);
      }
    });
  },

  /**
   * 设置加载状态
   */
  setLoading(isLoading) {
    this.setData({
      isLoading: isLoading
    });
  },

  /**
   * 切换图片
   */
  changeImage(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  /**
   * 拨打电话
   */
  makePhoneCall() {
    const phoneNumber = this.data.scenic.contactPhone;
    if (phoneNumber) {
      wx.makePhoneCall({
        phoneNumber: phoneNumber
      });
    }
  },

  /**
   * 导航到地图
   */
  openLocation() {
    const address = this.data.scenic.address;
    if (address) {
      wx.openLocation({
        address: address,
        success: (res) => {
          console.log('打开地图成功:', res);
        },
        fail: (err) => {
          console.error('打开地图失败:', err);
          wx.showToast({
            title: '打开地图失败',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 获取优惠后的价格
   */
  getDiscountedPrice(ticketId, originalPrice) {
    const discounts = this.data.discounts.filter(discount => {
      return discount.status === 1 && discount.ticketIds.includes(ticketId);
    });
    
    if (discounts.length > 0) {
      // 取第一个有效的优惠方案
      const discount = discounts[0];
      // 计算优惠后的价格
      const discountedPrice = originalPrice - discount.discountValue;
      return Math.max(0, discountedPrice); // 确保价格不小于0
    }
    return null;
  },
  
  /**
   * 为门票添加优惠信息
   */
  addDiscountInfoToTickets() {
    const ticketsWithDiscount = this.data.tickets.map(ticket => {
      const discountedPrice = this.getDiscountedPrice(ticket._id, ticket.price);
      return {
        ...ticket,
        discountedPrice: discountedPrice,
        hasDiscount: discountedPrice !== null
      };
    });
    
    this.setData({
      tickets: ticketsWithDiscount
    });
  },

  /**
   * 预定门票
   */
  bookTicket(e) {
    const ticketId = e.currentTarget.dataset.ticketId;
    const ticketName = e.currentTarget.dataset.ticketName;
    const ticketPrice = e.currentTarget.dataset.ticketPrice;
    
    // 查找对应的门票信息
    const ticket = this.data.tickets.find(t => t._id === ticketId);
    if (!ticket) {
      wx.showToast({
        title: '门票信息不存在',
        icon: 'error'
      });
      return;
    }
    
    // 检查库存
    if (ticket.stock <= 0) {
      wx.showToast({
        title: '门票已售罄',
        icon: 'error'
      });
      return;
    }
    
    // 显示预定模态框
    wx.showModal({
      title: '预定门票',
      content: `您确定要预定 ${ticketName} 吗？\n价格：¥${ticketPrice}`,
      success: (res) => {
        if (res.confirm) {
          // 这里可以实现具体的预定逻辑，比如创建订单
          // 暂时模拟预定成功
          wx.showToast({
            title: '预定成功',
            icon: 'success'
          });
          
          // 可以跳转到订单页面或其他相关页面
          // wx.navigateTo({ url: '/pages/order/order' });
        }
      }
    });
  }
})