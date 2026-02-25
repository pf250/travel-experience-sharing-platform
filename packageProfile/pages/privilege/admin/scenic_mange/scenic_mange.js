// packageProfile/pages/privilege/admin/scenic_mange/scenic_mange.js
Page({
  data: {
    scenicList: [],
    isLoading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadScenicList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新加载数据，确保数据最新
    this.loadScenicList();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadScenicList(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载所有景区数据
   */
  loadScenicList(callback) {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '加载中...',
    });
    
    this.setData({ isLoading: true });
    
    // 查询所有景区数据
    db.collection('scenic').get({
      success: (res) => {
        wx.hideLoading();
        this.setData({
          scenicList: res.data,
          isLoading: false
        });
        console.log('加载景区数据成功:', res.data.length, '个景区');
        if (callback) callback();
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
        console.error('加载景区数据失败:', err);
        if (callback) callback();
      }
    });
  },

  /**
   * 编辑景区
   */
  editScenic(e) {
    const scenicId = e.currentTarget.dataset.id;
    // 跳转到景区信息编辑页面
    wx.navigateTo({
      url: `/packageProfile/pages/privilege/merchant/scenic-info/scenic-info?scenicId=${scenicId}&isAdmin=true`
    });
  },

  /**
   * 删除景区
   */
  deleteScenic(e) {
    const scenicId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个景区吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          
          wx.showLoading({
            title: '删除中...',
          });
          
          db.collection('scenic').doc(scenicId).remove({
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 重新加载数据
              this.loadScenicList();
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
              console.error('删除景区失败:', err);
            }
          });
        }
      }
    });
  },


});