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
  },

  /**
   * 更新特定景区的浏览量
   */
  updateScenicViewCount(scenicId, viewCount) {
    const { scenicList } = this.data;
    const updatedList = scenicList.map(item => {
      if (item._id === scenicId) {
        const formattedViewCount = this.formatViewCount(viewCount);
        return { ...item, viewCount, formattedViewCount };
      }
      return item;
    });
    this.setData({ scenicList: updatedList });
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
    const _ = db.command;
    
    this.setData({ isLoading: true });
    
    db.collection('scenic')
      .where({
        status: '营业'
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get({
        success: (res) => {
          let newScenicList = res.data;
          
          // 过滤掉已删除的景区
          newScenicList = newScenicList.filter(item => !item.deleted);
          
          // 为每个景区添加格式化后的浏览量
          newScenicList = newScenicList.map(item => {
            const formattedViewCount = this.formatViewCount(item.viewCount || 0);
            return {
              ...item,
              formattedViewCount
            };
          });
          
          const updatedScenicList = page === 1 ? newScenicList : [...scenicList, ...newScenicList];
          
          // 实现排序逻辑：24小时内创建的按createdAt排序，超过24小时的按浏览量排序
          const now = new Date();
          const twentyFourHoursAgo = now.getTime() - 24 * 60 * 60 * 1000;
          
          updatedScenicList.sort((a, b) => {
            // 获取创建时间
            const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            
            // 检查是否在24小时内
            const aIsNew = aCreatedAt >= twentyFourHoursAgo;
            const bIsNew = bCreatedAt >= twentyFourHoursAgo;
            
            // 如果都是新的，按创建时间降序
            if (aIsNew && bIsNew) {
              return bCreatedAt - aCreatedAt;
            }
            // 如果都是旧的，按浏览量降序
            else if (!aIsNew && !bIsNew) {
              return (b.viewCount || 0) - (a.viewCount || 0);
            }
            // 如果一个是新的，一个是旧的，新的排在前面
            else {
              return aIsNew ? -1 : 1;
            }
          });
          
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
   * 格式化浏览量
   */
  formatViewCount(value) {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + 'W';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value;
  },

  /**
   * 点击景区进入详情页
   */
  navigateToDetail(e) {
    const scenicId = e.currentTarget.dataset.id;
    
    // 导航到详情页
    wx.navigateTo({
      url: `/pages/attraction/detail/detail?id=${scenicId}`
    });
  }
})