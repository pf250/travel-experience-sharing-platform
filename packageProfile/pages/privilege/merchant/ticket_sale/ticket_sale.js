// packageProfile/pages/privilege/merchant/ticket_sale/ticket_sale.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ticketSales: [],
    isLoading: true,
    totalSales: 0,
    totalRefunds: 0,
    totalAmount: 0
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadTicketSales();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadTicketSales();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 格式化时间
   */
  formatTime(time) {
    if (!time) return '';
    
    let date;
    if (typeof time === 'string') {
      // 处理字符串格式的时间
      if (time.includes('T')) {
        // ISO 格式: 2026-02-25T10:30:00
        date = new Date(time);
      } else if (time.includes(' ')) {
        // 普通格式: 2026-02-25 10:30:00
        const parts = time.split(/[- :]/);
        date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] || 0);
      } else {
        // 其他格式
        date = new Date(time);
      }
    } else {
      // 已经是 Date 对象
      date = time;
    }
    
    // 手动格式化时间，确保在所有设备上显示一致
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      userId: options.userId || ''
    });
    this.loadTicketSales();
  },

  /**
   * 加载门票销售数据
   */
  loadTicketSales() {
    const db = wx.cloud.database();
    const userId = this.data.userId;
    
    wx.showLoading({
      title: '加载中...'
    });
    
    // 1. 首先根据userId查询其管理的景区
    db.collection('scenic').where({
      userId: Number(userId),
      deleted: db.command.neq(true)
    }).get({
      success: (scenicRes) => {
        const scenicList = scenicRes.data;
        if (scenicList.length === 0) {
          // 没有景区，显示空状态
          this.setData({
            ticketSales: [],
            isLoading: false,
            totalSales: 0,
            totalRefunds: 0,
            totalAmount: 0
          });
          wx.hideLoading();
          return;
        }
        
        // 提取景区ID列表
        const scenicIds = scenicList.map(item => item._id);
        
        // 2. 查询属于这些景区的销售记录
        db.collection('ticket_sales').where({
          scenicId: db.command.in(scenicIds)
        }).get({
          success: (res) => {
            // 为每条记录添加格式化的时间
            const ticketSalesWithFormattedTime = res.data
              .map(item => ({
                ...item,
                formattedCreatedAt: this.formatTime(item.createdAt),
                formattedRefundTime: this.formatTime(item.refundTime)
              }))
              .sort((a, b) => {
                // 按创建时间倒序排序，最近的在前
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              });
            
            // 提取所有唯一的 userId
            const userIds = [...new Set(ticketSalesWithFormattedTime.map(item => item.userId).filter(id => id))];
            
            if (userIds.length > 0) {
              // 查询用户信息
              db.collection('users').where({
                userId: db.command.in(userIds)
              }).get({
                success: (userRes) => {
                  // 创建用户信息映射
                  const userMap = {};
                  userRes.data.forEach(user => {
                    userMap[user.userId] = user;
                  });
                  
                  // 关联用户信息
                  const ticketSalesWithUserInfo = ticketSalesWithFormattedTime.map(item => ({
                    ...item,
                    userInfo: userMap[item.userId] || null
                  }));
                  
                  this.processTicketSalesData(ticketSalesWithUserInfo);
                },
                fail: (userErr) => {
                  console.error('查询用户信息失败:', userErr);
                  // 即使查询用户信息失败，也要继续显示销售数据
                  this.processTicketSalesData(ticketSalesWithFormattedTime);
                }
              });
            } else {
              // 没有用户ID，直接处理数据
              this.processTicketSalesData(ticketSalesWithFormattedTime);
            }
          },
          fail: (err) => {
            console.error('加载门票销售数据失败:', err);
            this.setData({
              isLoading: false
            });
            wx.hideLoading();
            wx.showToast({
              title: '加载数据失败',
              icon: 'error'
            });
          }
        });
      },
      fail: (scenicErr) => {
        console.error('查询景区失败:', scenicErr);
        this.setData({
          isLoading: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '加载数据失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 处理门票销售数据
   */
  processTicketSalesData(ticketSalesData) {
    // 计算统计数据
    const totalSales = ticketSalesData.reduce((sum, item) => sum + (item.quantity || 0), 0); // 总销售：所有购买的门票数量（包括已退票的）
    const totalRefunds = ticketSalesData.filter(item => item.isRefunded).reduce((sum, item) => sum + (item.quantity || 0), 0); // 总退票：仅退票的数量
    const totalAmount = ticketSalesData
      .filter(item => !item.isRefunded)
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0); // 预计收益：仅未退票的金额
    
    this.setData({
      ticketSales: ticketSalesData,
      isLoading: false,
      totalSales,
      totalRefunds,
      totalAmount
    });
    console.log('加载门票销售数据成功:', ticketSalesData);
    wx.hideLoading();
  }
})