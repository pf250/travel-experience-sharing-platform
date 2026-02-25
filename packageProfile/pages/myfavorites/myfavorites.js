// packageProfile/pages/myfavorites/myfavorites.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ticketSales: [],
    filteredSales: [],
    currentTab: 0, // 0: 待使用, 1: 已退票
    isLoading: true
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
   * 加载用户的购票记录
   */
  loadTicketSales() {
    const db = wx.cloud.database();
    const loginState = wx.getStorageSync('loginState');
    
    if (!loginState || !loginState.isLogin) {
      this.setData({
        ticketSales: [],
        filteredSales: [],
        isLoading: false
      });
      return;
    }
    
    const userId = typeof loginState.userId === 'string' ? parseInt(loginState.userId) : loginState.userId;
    
    db.collection('ticket_sales').where({
      userId: userId
    }).get({
      success: (res) => {
        this.setData({
          ticketSales: res.data,
          isLoading: false
        });
        console.log('加载购票记录成功:', res.data);
        
        // 根据当前标签过滤数据
        this.filterTicketSales();
      },
      fail: (err) => {
        console.error('加载购票记录失败:', err);
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '加载购票记录失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 根据标签过滤购票记录
   */
  filterTicketSales() {
    const { ticketSales, currentTab } = this.data;
    let filtered = [];
    
    if (currentTab === 0) {
      // 待使用：状态为1且未退票
      filtered = ticketSales.filter(item => item.status === 1 && !item.isRefunded);
    } else if (currentTab === 1) {
      // 已退票：标记为已退票或状态为3
      filtered = ticketSales.filter(item => item.isRefunded || item.status === 3);
    }
    
    console.log('过滤后的数据:', filtered);
    console.log('当前标签:', currentTab);
    console.log('原始数据:', ticketSales);
    
    this.setData({
      filteredSales: filtered
    });
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const tabIndex = e.currentTarget.dataset.tabIndex;
    this.setData({
      currentTab: tabIndex
    });
    // 重新过滤数据
    this.filterTicketSales();
  },

  /**
   * 申请退票
   */
  refundTicket(e) {
    const saleId = e.currentTarget.dataset.saleId;
    const sale = this.data.ticketSales.find(item => item._id === saleId);
    
    if (!sale) return;
    
    wx.showModal({
      title: '申请退票',
      content: `确定要退掉 ${sale.ticketName} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRefund(sale);
        }
      }
    });
  },

  /**
   * 处理退票流程
   */
  processRefund(sale) {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '处理中...'
    });
    
    // 1. 更新 ticket_sales 记录，标记为已退票
    db.collection('ticket_sales').doc(sale._id).update({
      data: {
        status: 3, // 3: 已取消
        isRefunded: true, // 标记为已退票
        updatedAt: db.serverDate()
      },
      success: () => {
        console.log('更新退票状态成功');
        
        // 2. 恢复门票库存
        db.collection('ticket').doc(sale.ticketId).update({
          data: {
            stock: db.command.inc(sale.quantity),
            updatedAt: db.serverDate()
          },
          success: () => {
            console.log('恢复库存成功');
            wx.hideLoading();
            wx.showToast({
              title: '退票成功',
              icon: 'success'
            });
            
            // 3. 重新加载数据
            this.loadTicketSales();
            
            // 4. 切换到已退票标签页
            this.setData({
              currentTab: 1
            });
            // 重新过滤数据
            this.filterTicketSales();
          },
          fail: (err) => {
            console.error('恢复库存失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '恢复库存失败',
              icon: 'error'
            });
          }
        });
      },
      fail: (err) => {
        console.error('更新退票状态失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '退票失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 查看景区详情
   */
  viewScenicDetail(e) {
    const scenicId = e.currentTarget.dataset.scenicId;
    wx.navigateTo({
      url: `/pages/attraction/detail/detail?id=${scenicId}`
    });
  }
})