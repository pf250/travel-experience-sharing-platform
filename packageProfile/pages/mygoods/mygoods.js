// packageProfile/pages/mygoods/mygoods.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    items: [], // 商品列表
    chunkedItems: [], // 分组后的商品列表
    userId: '', // 用户ID
    loading: true, // 加载状态
    empty: false // 空状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 接收从其他界面传递过来的userId参数
    if (options.userId) {
      // 将userId转换为数字类型，确保与数据库中存储的类型一致
      const userId = parseInt(options.userId);
      this.setData({ userId });
      this.loadUserItems(userId);
    } else {
      // 没有传递userId参数，显示错误提示
      wx.showToast({ title: '缺少必要参数', icon: 'none' });
      this.setData({ loading: false, empty: true });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果已经有userId，则重新加载商品
    if (this.data.userId) {
      // 确保userId是数字类型
      const userId = parseInt(this.data.userId);
      this.loadUserItems(userId);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (this.data.userId) {
      // 确保userId是数字类型
      const userId = parseInt(this.data.userId);
      this.loadUserItems(userId, true);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 加载用户发布的商品
   */
  async loadUserItems(userId, isPullRefresh = false) {
    try {
      if (!isPullRefresh) {
        this.setData({ loading: true, empty: false });
      }

      // 查询用户发布的商品
      const items = await wx.cloud.database().collection('items')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get();

      // 对商品列表进行分组，每组2个
      const chunkedItems = this.chunkArray(items.data, 2);

      this.setData({
        items: items.data,
        chunkedItems,
        loading: false,
        empty: items.data.length === 0
      });

      if (isPullRefresh) {
        wx.stopPullDownRefresh();
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      this.setData({ loading: false, empty: true });
      if (isPullRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 将数组按指定大小分组
   * @param {Array} array - 要分组的数组
   * @param {number} size - 每组的大小
   * @returns {Array} - 分组后的数组
   */
  chunkArray(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  },

  /**
   * 跳转到商品详情页
   */
  navigateToDetail(event) {
    const itemId = event.currentTarget.dataset.itemId;
    wx.navigateTo({
      url: `/packageHome/pages/market/detail/detail?itemId=${itemId}`
    });
  },

  /**
   * 删除商品
   */
  deleteItem(e) {
    const itemId = e.currentTarget.dataset.itemId;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这件商品吗？删除后将无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 显示删除中加载提示
            wx.showLoading({ title: '删除中...', mask: true });
            
            // 删除商品
            await wx.cloud.database().collection('items')
              .doc(itemId)
              .remove();
            
            // 隐藏加载提示
            wx.hideLoading();
            
            // 显示删除成功提示
            wx.showToast({ title: '删除成功', icon: 'success' });
            
            // 重新加载商品列表
            if (this.data.userId) {
              const userId = parseInt(this.data.userId);
              this.loadUserItems(userId);
            }
          } catch (error) {
            // 隐藏加载提示
            wx.hideLoading();
            
            console.error('删除商品失败:', error);
            wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' });
          }
        }
      }
    });
  }
})