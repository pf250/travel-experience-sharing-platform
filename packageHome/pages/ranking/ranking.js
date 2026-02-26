// packageHome/pages/ranking/ranking.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scenicList: [], // 景区列表
    isLoading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadRankingList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.scenicList.length === 0) {
      this.loadRankingList();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadRankingList(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 格式化热度值
   */
  formatHeatValue(value) {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + 'W';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value;
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
   * 加载热度排行榜
   */
  loadRankingList(callback) {
    const db = wx.cloud.database();
    this.setData({ isLoading: true });
    
    db.collection('scenic')
      .where({
        status: '营业'
      })
      .get({
        success: (res) => {
          // 计算热度值并排序
          const scenicList = res.data
            .filter(item => !item.deleted) // 过滤掉已删除的景区
            .map(item => {
              // 热度值 = 浏览量 * 100
              const heat = (item.viewCount || 0) * 100;
              // 格式化热度值
              const formattedHeat = this.formatHeatValue(heat);
              // 格式化浏览量
              const formattedViewCount = this.formatViewCount(item.viewCount || 0);
              return {
                ...item,
                heat,
                formattedHeat,
                formattedViewCount
              };
            }).sort((a, b) => {
              // 按热度值降序排序
              return b.heat - a.heat;
            });
          
          this.setData({
            scenicList,
            isLoading: false
          });
          console.log('热度排行榜加载成功:', scenicList.length, '个景区');
          if (callback) callback();
        },
        fail: (err) => {
          console.error('加载热度排行榜失败:', err);
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