Page({
  data: {
    // 轮播图数据
    banners: [],
    currentIndex: 0, // 当前展示的图片索引
    notices: [
       { id: 1, content: '欢迎来到人文校园墙，这里是校园生活服务平台' },     //最大长度
      { id: 2, content: '跳蚤市场上线啦，快来发布二手商品吧' },
      { id: 3, content: '帖子功能上线啦，快来留言吧' }
    ],
    functions: [
      { 
        id: 1, 
        name: '跳蚤市场', 
        icon: '/images/home/market.png', 
        url: '/packageHome/pages/market/market' 
      },
      { 
        id: 2, 
        name: '排行榜', 
        icon: '/images/home/ranking.png', 
        url: '/packageHome/pages/ranking/ranking' 
      },
      { 
        id: 3, 
        name: '需求墙', 
        icon: '/images/home/demandwall.png', 
        url: '/packageHome/pages/demandwall/demandwall' 
      },
      { 
        id: 4, 
        name: '资源库', 
        icon: '/images/home/resource.png', 
        url: '/packageHome/pages/resource/resource' 
      },
    ]
  },


  onFunctionTap(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url,
        success: () => console.log('导航到:', url),
        fail: err => console.error('导航失败:', err)
      });
    } else {
      console.warn('未找到有效的 URL');
    }
  },

  onLoad() {
    this.loadBanners(); // 加载轮播图数据
  },

  // 监听 swiper 切换事件
  onSwiperChange(event) {
    const currentIndex = event.detail.current; // 获取当前索引
    this.setData({ currentIndex });
  },

  loadBanners() {
    wx.showLoading({
      title: '加载中...',
    });
    const db = wx.cloud.database();
    db.collection('banners').doc('banners-data').get({
      success: res => {
        const fileIDs = res.data.fileIDs;
        this.loadBannersImages(fileIDs);
      },
      fail: err => {
        console.error('获取 File ID 列表失败', err);
        wx.showToast({
          title: '加载轮播图失败，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  loadBannersImages(fileIDs) {
    wx.cloud.getTempFileURL({
      fileList: fileIDs.map((fileID, index) => ({ fileID, maxAge: 172800 })),
      success: res => {
        const banners = res.fileList.map((item, index) => ({
          id: index + 1,
          imageUrl: item.tempFileURL,
          linkUrl: `/pages/detail/detail?id=${index + 1}`
        }));
        this.setData({ banners });
      },
      fail: err => {
        console.error('获取临时地址失败', err);
        wx.showToast({
          title: '加载图片失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  onBannerTap(event) {
    const id = event.currentTarget.dataset.id;
    const banner = this.data.banners.find(item => item.id === id);
    if (banner && banner.linkUrl) {
      wx.navigateTo({
        url: banner.linkUrl
      });
    }
  }
});