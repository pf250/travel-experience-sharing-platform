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
    
    db.collection('ticket_sales').where(
      db.command.and([
        { userId: userId },
        db.command.or([
          { isDeleted: false },
          { isDeleted: db.command.exists(false) }
        ])
      ])
    ).get({
      success: (res) => {
        // 为每条记录添加格式化的时间并按创建时间倒序排序
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
        
        this.setData({
          ticketSales: ticketSalesWithFormattedTime,
          isLoading: false
        });
        console.log('加载购票记录成功:', ticketSalesWithFormattedTime);
        
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
    
    // 确保 currentTab 是数字类型
    const tabIndex = parseInt(currentTab);
    
    if (tabIndex === 0) {
      // 待使用：状态为1且未退票
      filtered = ticketSales.filter(item => item.status === 1 && !item.isRefunded);
    } else if (tabIndex === 1) {
      // 已退票：标记为已退票或状态为3
      filtered = ticketSales.filter(item => item.isRefunded || item.status === 3);
    }
    
    // 只打印过滤后的数据长度，避免打印大量数据导致卡死
    console.log('过滤后的数据长度:', filtered.length);
    console.log('当前标签:', tabIndex);
    
    this.setData({
      filteredSales: filtered
    });
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    // 将 tabIndex 转换为数字类型
    const tabIndex = parseInt(e.currentTarget.dataset.tabIndex);
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
        refundTime: db.serverDate(), // 记录退票时间
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
  },

  /**
   * 删除已退票记录
   */
  deleteRecord(e) {
    const saleId = e.currentTarget.dataset.saleId;
    
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条退票记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.processDelete(saleId);
        }
      }
    });
  },

  /**
   * 处理删除记录（逻辑删除）
   */
  processDelete(saleId) {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '处理中...'
    });
    
    // 逻辑删除：更新记录状态为已删除
    db.collection('ticket_sales').doc(saleId).update({
      data: {
        isDeleted: true, // 标记为已删除
        updatedAt: db.serverDate()
      },
      success: () => {
        console.log('删除记录成功');
        wx.hideLoading();
        wx.showToast({
          title: '删除记录成功',
          icon: 'success'
        });
        
        // 重新加载数据
        this.loadTicketSales();
      },
      fail: (err) => {
        console.error('删除记录失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除记录失败',
          icon: 'error'
        });
      }
    });
  }
})