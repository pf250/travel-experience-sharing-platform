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
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadTicketSales();
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
    const date = typeof time === 'string' ? new Date(time) : time;
    return date.toLocaleString();
  },

  /**
   * 加载门票销售数据
   */
  loadTicketSales() {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '加载中...'
    });
    
    // 查询所有门票销售记录
    db.collection('ticket_sales').get({
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
        
        // 计算统计数据
        const totalSales = ticketSalesWithFormattedTime.reduce((sum, item) => sum + (item.quantity || 0), 0); // 总销售：所有购买的门票数量（包括已退票的）
        const totalRefunds = ticketSalesWithFormattedTime.filter(item => item.isRefunded).reduce((sum, item) => sum + (item.quantity || 0), 0); // 总退票：仅退票的数量
        const totalAmount = ticketSalesWithFormattedTime
          .filter(item => !item.isRefunded)
          .reduce((sum, item) => sum + (item.totalPrice || 0), 0); // 预计收益：仅未退票的金额
        
        this.setData({
          ticketSales: ticketSalesWithFormattedTime,
          isLoading: false,
          totalSales,
          totalRefunds,
          totalAmount
        });
        console.log('加载门票销售数据成功:', ticketSalesWithFormattedTime);
        wx.hideLoading();
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
  }
})