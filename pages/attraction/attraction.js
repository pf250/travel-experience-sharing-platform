// pages/attraction/attraction.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scenicList: [],
    isLoading: true,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.queryScenicList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    this.setData({
      page: 1,
      scenicList: [],
      hasMore: true
    });
    this.queryScenicList();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时重置数据
    this.setData({
      page: 1,
      scenicList: [],
      hasMore: true
    });
    this.queryScenicList(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.isLoading) {
      this.queryScenicList();
    }
  },

  /**
   * 查询景区列表
   */
  queryScenicList(callback) {
    const { page, pageSize, scenicList } = this.data;
    const db = wx.cloud.database();
    
    this.setData({ isLoading: true });
    
    db.collection('scenic')
      .where({
        status: '营业'
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get({
        success: (res) => {
          const newScenicList = res.data;
          const updatedScenicList = page === 1 ? newScenicList : [...scenicList, ...newScenicList];
          
          this.setData({
            scenicList: updatedScenicList,
            hasMore: newScenicList.length === pageSize,
            page: page + 1,
            isLoading: false
          });
          
          console.log('查询景区列表成功:', updatedScenicList.length, '个');
          if (callback) callback();
        },
        fail: (err) => {
          console.error('查询景区列表失败:', err);
          this.setData({ isLoading: false });
          wx.showToast({
            title: '加载失败',
            icon: 'error'
          });
          if (callback) callback();
        }
      });
  },

  /**
   * 点击景区进入详情页
   */
  navigateToDetail(e) {
    const scenicId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/attraction/detail/detail?id=${scenicId}`
    });
  }
})