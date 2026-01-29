Page({
  data: {
    items: [], // 商品列表
    chunkedItems: [], // 分组后的商品列表
    page: 1, // 当前页码
    limit: 8, // 每页加载的数据条数
    hasMore: true, // 是否还有更多数据可以加载
    isRefreshing: false, // 是否正在刷新
    isLoading: false, // 是否正在加载数据（防抖用）
    searchKeyword: '', // 搜索关键词
    selectedCategory: '', // 当前选中的分类
    categories: ['推荐', '数码', '书籍', '服装', '美妆', '游戏', '家居生活', '体育用品', '其他'], // 分类列表
    showLoadingType: 'none' // 加载状态：'more' | 'loading' | 'noMore'
  },

  /**
   * 页面加载时触发
   */
  onLoad() {
    this.initRefresh(); // 初始化加载数据
  },

  /**
   * 初始化加载（首屏优化）
   */
  initRefresh() {
    wx.showNavigationBarLoading(); // 显示顶部加载动画
    this.fetchItems(true).finally(() => {
      wx.hideNavigationBarLoading(); // 隐藏顶部加载动画
    });
  },

  /**
   * 数据获取方法
   * @param {boolean} isRefresh - 是否是下拉刷新
   */
  async fetchItems(isRefresh = false) {
    if (this.data.isLoading) return; // 如果正在加载，直接返回
    if (!this.data.hasMore && !isRefresh) return; // 如果没有更多数据且不是刷新，直接返回

    const { page, limit, items } = this.data;

    // 设置加载状态
    this.setData({
      isLoading: true,
      showLoadingType: isRefresh ? 'loading' : 'more'
    });

    try {
      // 构建查询条件
      let query = wx.cloud.database().collection('items').orderBy('createdAt', 'desc');
      if (this.data.selectedCategory && this.data.selectedCategory !== '推荐') {
        query = query.where({ category: this.data.selectedCategory });
      }

      // 查询数据
      const res = await query.skip((page - 1) * limit).limit(limit).get();
      const newItems = res.data;
      const hasMore = newItems.length >= limit;

      // 更新分块数据
      const newChunks = this.chunkArray(newItems, 2); // 对新增数据进行分组
      this.setData({
        items: isRefresh ? newItems : [...items, ...newItems], // 合并新数据
        page: isRefresh ? 2 : page + 1, // 更新页码
        hasMore,
        chunkedItems: isRefresh ? newChunks : [...this.data.chunkedItems, ...newChunks], // 更新分组数据
        showLoadingType: hasMore ? 'more' : 'noMore' // 更新加载状态
      });
    } catch (err) {
      console.error('数据加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({
        isLoading: false,
        isRefreshing: false
      });
      if (isRefresh) wx.stopPullDownRefresh(); // 停止下拉刷新动画
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
   * 分类点击处理
   * @param {Event} e - 点击事件
   */
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    if (this.data.selectedCategory === category) return; // 如果点击的是当前分类，不处理

    this.setData({
      selectedCategory: category,
      page: 1,
      hasMore: true,
      chunkedItems: []
    });

    wx.pageScrollTo({ scrollTop: 0 }); // 滚动到顶部
    this.initRefresh(); // 刷新数据
  },

  /**
   * 触底加载更多数据
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.fetchItems(); // 加载下一页数据
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    if (this.data.isRefreshing) return; // 如果正在刷新，直接返回

    this.setData({
      isRefreshing: true,
      page: 1,
      hasMore: true,
      chunkedItems: []
    });

    this.initRefresh(); // 刷新数据
  },

  /**
   * 搜索输入框内容变化时触发
   * @param {Event} e - 输入事件
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value.trim()
    });
  },

  /**
   * 搜索功能
   */
  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      this.initRefresh(); // 如果搜索关键词为空，重新加载默认数据
      return;
    }

    wx.showLoading({ title: '搜索中' });
    wx.cloud.database().collection('items')
      .where({ description: new RegExp(keyword, 'i') }) // 模糊匹配
      .get()
      .then(res => {
        this.setData({
          chunkedItems: this.chunkArray(res.data, 2), // 对搜索结果分组
          showLoadingType: 'noMore'
        });
      })
      .catch(err => {
        console.error('搜索失败:', err);
        wx.showToast({ title: '搜索失败', icon: 'none' });
      })
      .finally(() => wx.hideLoading());
  },

  /**
   * 跳转到商品详情页
   * @param {Event} event - 点击事件
   */
  navigateToDetail(event) {

      // 检查是否登录
      const isLoggedIn = this.checkLogin();
      if (!isLoggedIn) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        });
        // 未登录时跳转到指定页面
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/profile/profile', // 确保路径正确
          });
        }, 1000); // 1秒后跳转
        return;
      }

    const itemId = event.currentTarget.dataset.itemId; // 获取商品 ID
    wx.navigateTo({
      url: `/packageHome/pages/market/detail/detail?itemId=${itemId}` // 跳转到详情页并传递商品 ID
    });
  },

   // 检查登录状态的方法
   checkLogin() {
    // 从本地缓存中获取登录状态
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin; // 如果有登录状态且 isLogin 为 true，则返回 true
  }
});