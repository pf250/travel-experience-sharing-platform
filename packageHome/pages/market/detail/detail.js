Page({
  data: {
    item: null, // 商品详情数据
    isFavorite: false, // 是否已收藏
    formattedCreatedAt: '', // 格式化后的创建时间
  },

  onLoad(options) {
    const itemId = options.itemId; // 获取传递的商品 ID
    if (itemId) {
      this.fetchItemDetail(itemId);
    } else {
      console.error('未接收到商品 ID');
    }
  },

  // 获取商品详情数据
  fetchItemDetail(itemId) {
    wx.cloud.database().collection('items')
      .doc(itemId)
      .get()
      .then(async res => {
        console.log('商品详情数据:', res.data);
        const item = res.data;

        // 检查 images 是否存在且为数组
        if (Array.isArray(item.images)) {
          // 将云文件路径转换为临时链接
          const tempUrls = await Promise.all(
            item.images.map(fileID => this.getFileTempUrl(fileID))
          ); 

          // 格式化创建时间
          const formattedCreatedAt = this.formatDate(new Date(item.createdAt));

          // 更新 item 数据，将临时链接赋值给 images
          this.setData({
            item: { ...item, images: tempUrls },
            formattedCreatedAt,
          });
        } else {
          console.error('images 字段不是数组或为空');
        }
      })
      .catch(err => {
        console.error('获取商品详情失败:', err);
      });
  },

  // 获取云文件的临时链接
  getFileTempUrl(fileID) {
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: [fileID],
        success: res => {
          const tempUrl = res.fileList[0].tempFileURL;
          resolve(tempUrl);
        },
        fail: err => {
          console.error('获取临时链接失败:', err);
          reject(err);
        },
      });
    });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  // 联系商家
  contactSeller() {
    wx.showToast({
      title: '联系商家功能暂未实现',
      icon: 'none',
    });
  },

  // 购买按钮事件
  buyProduct: function () {
    wx.showToast({
      title: '立即购买',
      icon: 'success'
    });
    // 可以在这里添加跳转到支付页面或其他逻辑
  },

  // 查看评论
  showComments() {
    wx.showToast({
      title: '查看评论功能暂未实现',
      icon: 'none',
    });
  },

  // 切换收藏状态
  toggleFavorite() {
    const isFavorite = !this.data.isFavorite;
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '取消收藏',
      icon: 'success',
    });
  },

// 图片预览功能
previewImage(e) {
  const currentIndex = e.currentTarget.dataset.index; // 获取当前图片索引
  const images = this.data.item.images; // 获取所有图片链接
  wx.previewImage({
    current: images[currentIndex], // 当前显示图片的链接
    urls: images, // 所有图片链接
  });
},

});