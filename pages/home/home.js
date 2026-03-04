Page({
  data: {
    // 轮播图数据
    banners: [],
    currentIndex: 0, // 当前展示的图片索引
    notices: [
       { id: 1, content: '欢迎来到人文旅游，这里是旅游社交平台' },     //最大长度
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
        name: '社区规则', 
        icon: '/images/home/demandwall.png', 
        url: '/packageHome/pages/demandwall/demandwall' 
      },
      { 
        id: 4, 
        name: '资源库', 
        icon: '/images/home/resource.png', 
        url: '/packageHome/pages/resource/resource' 
      },
    ],
    // 热门景点推荐
    hotScenic: [],
    // 精选帖子
    featuredPosts: [],
    // 优惠活动
    promotions: [],
    // 加载状态
    isLoading: true,
    // AI悬浮窗位置
    aiButtonLeft: 600, // 初始位置：右侧
    aiButtonBottom: 120,
    // 触摸相关
    isDragging: false,
    // 防止下拉刷新
    preventPullDown: false,
    // 登录状态
    isLogin: false,
    avatarUrl: '',
    nickName: '',
    userId: null
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
    this.loadHomeData(); // 加载首页数据
  },

  // 加载首页所有数据
  loadHomeData() {
    return Promise.all([
      this.loadBanners(),
      this.loadHotScenic(),
      this.loadFeaturedPosts(),
      this.loadPromotions()
    ]).then(() => {
      this.setData({ isLoading: false });
      console.log('首页数据加载完成');
    }).catch(err => {
      console.error('加载首页数据失败:', err);
      this.setData({ isLoading: false });
    });
  },

  // 加载热门景点
  loadHotScenic() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      
      db.collection('scenic')
        .where({
          status: '营业'
        })
        .limit(10)
        .get({
          success: (res) => {
            const hotScenic = res.data
              .filter(item => !item.deleted) // 过滤掉已删除的景区
              .map(item => {
                const formattedViewCount = this.formatViewCount(item.viewCount || 0);
                return {
                  id: item._id,
                  name: item.name || '未知景区',
                  location: item.address || '未知位置',
                  image: item.images && item.images.length > 0 ? item.images[0] : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20scenic%20view%20placeholder&image_size=landscape_4_3',
                  viewCount: item.viewCount || 0,
                  formattedViewCount: formattedViewCount,
                  rating: item.rating || 4.5
                };
              }).sort((a, b) => {
                // 按浏览量降序排序
                return b.viewCount - a.viewCount;
              }).slice(0, 3); // 取前3个
            
            this.setData({ hotScenic });
            console.log('热门景点加载成功:', hotScenic.length, '个');
            resolve(hotScenic);
          },
          fail: (err) => {
            console.error('加载热门景点失败:', err);
            // 如果加载失败，使用默认数据
            const defaultScenic = [
              {
                id: 'default1',
                name: '故宫博物院',
                location: '北京市东城区景山前街4号',
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forbidden%20city%20beijing%20china%20ancient%20palace%20cultural%20heritage&image_size=landscape_4_3',
                viewCount: 125800,
                formattedViewCount: '12.6W',
                rating: 4.9
              },
              {
                id: 'default2',
                name: '西湖',
                location: '浙江省杭州市西湖区龙井路1号',
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=west%20lake%20hangzhou%20china%20scenic%20view%20traditional%20chinese%20garden&image_size=landscape_4_3',
                viewCount: 98600,
                formattedViewCount: '9.9W',
                rating: 4.8
              },
              {
                id: 'default3',
                name: '长城',
                location: '北京市怀柔区G110国道',
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=great%20wall%20of%20china%20badaling%20mountain%20landscape%20historic&image_size=landscape_4_3',
                viewCount: 156200,
                formattedViewCount: '15.6W',
                rating: 4.9
              }
            ];
            this.setData({ hotScenic: defaultScenic });
            resolve(defaultScenic);
          }
        });
    });
  },

  // 加载精选帖子
  loadFeaturedPosts() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      
      db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get({
          success: async (res) => {
            if (res.data.length === 0) {
              // 如果没有帖子，使用默认数据
              const defaultPosts = [
                {
                  id: 'default1',
                  title: '云南大理三日游攻略',
                  author: '旅行达人',
                  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20blogger%20avatar%20professional%20portrait&image_size=square',
                  content: '大理的风花雪月真的名不虚传，洱海的日落美到窒息...',
                  likeCount: 258,
                  commentCount: 42
                },
                {
                  id: 'default2',
                  title: '成都美食地图',
                  author: '吃货小王',
                  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20blogger%20avatar%20happy%20smile&image_size=square',
                  content: '打卡了10家成都必吃美食，最推荐的是...',
                  likeCount: 186,
                  commentCount: 35
                }
              ];
              this.setData({ featuredPosts: defaultPosts });
              resolve(defaultPosts);
              return;
            }
            
            // 获取每个帖子的点赞数和评论数
            const postsWithCounts = await Promise.all(
              res.data.map(async (post) => {
                try {
                  const likeCount = await this.getLikeCount(post._id);
                  const commentCount = await this.getCommentCount(post._id);
                  return {
                    id: post._id,
                    title: post.title || post.description || '无标题',
                    author: post.nickName || post.author || post.username || '匿名用户',
                    avatar: post.avatarUrl || post.avatar || post.userAvatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder&image_size=square',
                    content: post.description || post.content || '无内容',
                    likeCount: likeCount,
                    commentCount: commentCount
                  };
                } catch (error) {
                  console.error('获取帖子数据失败:', error);
                  return {
                    id: post._id,
                    title: post.title || post.description || '无标题',
                    author: post.nickName || post.author || post.username || '匿名用户',
                    avatar: post.avatarUrl || post.avatar || post.userAvatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder&image_size=square',
                    content: post.description || post.content || '无内容',
                    likeCount: 0,
                    commentCount: 0
                  };
                }
              })
            );
            
            // 按点赞数排序，取前2个
            const sortedPosts = postsWithCounts.sort((a, b) => {
              return b.likeCount - a.likeCount;
            }).slice(0, 2);
            
            this.setData({ featuredPosts: sortedPosts });
            console.log('精选帖子加载成功:', sortedPosts.length, '个');
            resolve(sortedPosts);
          },
          fail: (err) => {
            console.error('加载精选帖子失败:', err);
            // 使用默认数据
            const defaultPosts = [
              {
                id: 'default1',
                title: '云南大理三日游攻略',
                author: '旅行达人',
                avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20blogger%20avatar%20professional%20portrait&image_size=square',
                content: '大理的风花雪月真的名不虚传，洱海的日落美到窒息...',
                likeCount: 258,
                commentCount: 42
              },
              {
                id: 'default2',
                title: '成都美食地图',
                author: '吃货小王',
                avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20blogger%20avatar%20happy%20smile&image_size=square',
                content: '打卡了10家成都必吃美食，最推荐的是...',
                likeCount: 186,
                commentCount: 35
              }
            ];
            this.setData({ featuredPosts: defaultPosts });
            resolve(defaultPosts);
          }
        });
    });
  },

  // 加载优惠活动
  loadPromotions() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      const now = new Date();
      
      db.collection('discounts')
        .get({
          success: async (res) => {
            let promotions = [];
            
            if (res.data.length > 0) {
              // 处理优惠活动数据
              promotions = await Promise.all(
                res.data.map(async (discount) => {
                  try {
                    // 获取关联的景区信息
                    const scenicRes = await db.collection('scenic')
                      .doc(discount.scenicId)
                      .get();
                    
                    const scenic = scenicRes.data;
                    
                    // 检查景区是否被删除
                    if (scenic.deleted) {
                      return null; // 跳过已删除景区的优惠活动
                    }
                    
                    // 获取适用门票信息
                    let ticketNames = '全部门票';
                    if (discount.ticketIds && discount.ticketIds.length > 0) {
                      try {
                        const ticketsRes = await db.collection('ticket')
                          .where({
                            _id: db.command.in(discount.ticketIds),
                            status: 1
                          })
                          .get();
                        
                        if (ticketsRes.data.length > 0) {
                          ticketNames = ticketsRes.data.map(ticket => ticket.name).join('、');
                        }
                      } catch (ticketError) {
                        console.error('获取门票信息失败:', ticketError);
                      }
                    }
                    
                    return {
                      id: discount._id,
                      title: discount.title || '优惠活动',
                      description: `${scenic.name || '景区'}门票优惠`,
                      discountValue: discount.discountValue || 0,
                      ticketNames: ticketNames,
                      endTime: discount.endTime ? discount.endTime.split(' ')[0] : '2026-12-31',
                      image: scenic.images && scenic.images.length > 0 ? scenic.images[0] : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20promotion%20banner%20colorful&image_size=landscape_4_3',
                      scenicId: scenic._id,
                      originalEndTime: discount.endTime
                    };
                  } catch (error) {
                    console.error('处理优惠活动数据失败:', error);
                    return null; // 出错时跳过此优惠活动
                  }
                })
              );
              
              // 过滤掉null值（已删除景区的优惠活动）和已结束的活动
              promotions = promotions.filter(promotion => {
                if (!promotion) return false; // 过滤掉null值
                if (!promotion.originalEndTime) return true;
                // 处理iOS日期格式兼容性问题
                const endTimeStr = promotion.originalEndTime.replace(/\s+/g, 'T');
                const endDate = new Date(endTimeStr);
                return endDate >= now;
              });
            }
            
            // 如果没有优惠活动，使用默认数据
            if (promotions.length === 0) {
              promotions = [
                {
                  id: 'default1',
                  title: '春季旅游大促',
                  description: '全场景区门票优惠',
                  discountValue: 20,
                  ticketNames: '全部门票',
                  endTime: '2026-04-30',
                  image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20travel%20promotion%20banner%20colorful%20vibrant&image_size=landscape_4_3',
                  scenicId: ''
                },
                {
                  id: 'default2',
                  title: '新用户专享',
                  description: '注册即送旅游基金',
                  discountValue: 50,
                  ticketNames: '全部门票',
                  endTime: '2026-06-30',
                  image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20user%20promotion%20travel%20gift%20card%20modern&image_size=landscape_4_3',
                  scenicId: ''
                }
              ];
            }
            
            this.setData({ promotions });
            console.log('优惠活动加载成功:', promotions.length, '个');
            resolve(promotions);
          },
          fail: (err) => {
            console.error('加载优惠活动失败:', err);
            // 使用默认数据
            const defaultPromotions = [
              {
                id: 'default1',
                title: '春季旅游大促',
                description: '全场景区门票8折起',
                endTime: '2026-04-30',
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20travel%20promotion%20banner%20colorful%20vibrant&image_size=landscape_4_3'
              },
              {
                id: 'default2',
                title: '新用户专享',
                description: '注册即送50元旅游基金',
                endTime: '2026-06-30',
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20user%20promotion%20travel%20gift%20card%20modern&image_size=landscape_4_3'
              }
            ];
            this.setData({ promotions: defaultPromotions });
            resolve(defaultPromotions);
          }
        });
    });
  },

  // 获取点赞数
  getLikeCount(postId) {
    return new Promise((resolve) => {
      const db = wx.cloud.database();
      db.collection('likes')
        .where({ postId })
        .count({
          success: (res) => {
            resolve(res.total || 0);
          },
          fail: () => {
            resolve(0);
          }
        });
    });
  },

  // 获取评论数
  getCommentCount(postId) {
    return new Promise((resolve) => {
      const db = wx.cloud.database();
      db.collection('comments')
        .where({ postId })
        .count({
          success: (res) => {
            resolve(res.total || 0);
          },
          fail: () => {
            resolve(0);
          }
        });
    });
  },

  // 格式化浏览量
  formatViewCount(value) {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + 'W';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value;
  },

  // 状态转换为中文
  getStatusText(status) {
    const statusMap = {
      planning: '规划中',
      design: '设计中',
      development: '开发中',
      research: '研究中'
    };
    return statusMap[status] || status;
  },

  // 监听 swiper 切换事件
  onSwiperChange(event) {
    const currentIndex = event.detail.current; // 获取当前索引
    this.setData({ currentIndex });
  },

  loadBanners() {
    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: '加载中...',
      });
      const db = wx.cloud.database();
      db.collection('banners').doc('banners-data').get({
        success: res => {
          const fileIDs = res.data.fileIDs;
          this.loadBannersImages(fileIDs);
          resolve();
        },
        fail: err => {
          console.error('获取 File ID 列表失败', err);
          wx.showToast({
            title: '加载轮播图失败，请稍后重试',
            icon: 'none'
          });
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
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
    const bannerIndex = this.data.banners.findIndex(item => item.id === id);
    if (bannerIndex !== -1) {
      // 获取所有轮播图的图片链接
      const imageUrls = this.data.banners.map(item => item.imageUrl);
      // 使用 wx.previewImage 放大查看图片
      wx.previewImage({
        urls: imageUrls,
        current: imageUrls[bannerIndex],
        success: function(res) {
          console.log('预览图片成功');
        },
        fail: function(err) {
          console.error('预览图片失败:', err);
        }
      });
    }
  },

  // 显示提示信息
  showToast(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 1000
    });
  },

  // 加载用户信息
  loadUserInfo() {
    const loginState = wx.getStorageSync('loginState');
    if (loginState && loginState.isLogin && loginState.userId) {
      this.setData({
        isLogin: true,
        avatarUrl: loginState.avatarUrl,
        nickName: loginState.nickName,
        userId: Number(loginState.userId), // 将 userId 转换为数字类型
      });
      return true;
    } else {
      console.warn('用户未登录或 userId 无效');
      this.showToast('请先登录');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 1000);
      return false;
    }
  },

  // 检查登录状态
  checkLogin() {
    const loginState = wx.getStorageSync('loginState');
    return loginState && loginState.isLogin;
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 如果正在拖动悬浮窗或设置了防止下拉刷新，不执行下拉刷新
    if (this.data.isDragging || this.data.preventPullDown) {
      wx.stopPullDownRefresh();
      return;
    }
    
    console.log('下拉刷新开始');
    // 重新加载首页数据
    this.loadHomeData().then(() => {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
      console.log('下拉刷新完成');
    }).catch(err => {
      console.error('下拉刷新失败:', err);
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    });
  },

  // AI悬浮窗点击事件
  onAIClick() {
    // 只有在非拖动状态下才执行跳转
    if (!this.data.isDragging) {
      // 检查登录状态
      if (!this.checkLogin()) {
        this.loadUserInfo();
        return;
      }
      wx.navigateTo({
        url: '/packageAI_agent/pages/detail/detail',
        success: () => console.log('导航到AI客服页面'),
        fail: err => console.error('导航失败:', err)
      });
    }
  },

  // 触摸开始事件
  onTouchStart(event) {
    // 存储初始位置到实例变量，避免setData的异步延迟
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.setData({
      isDragging: false,
      preventPullDown: true
    });
  },

  // 触摸移动事件
  onTouchMove(event) {
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.startX;
    const deltaY = currentY - this.startY;

    // 计算新位置（转换为rpx，假设1px=2rpx）
    let newLeft = this.data.aiButtonLeft + deltaX * 2;
    let newBottom = this.data.aiButtonBottom - deltaY * 2; // 注意：Y轴方向相反

    // 限制边界
    const windowInfo = wx.getWindowInfo();
    const windowWidth = windowInfo.windowWidth * 2; // 转换为rpx
    const windowHeight = windowInfo.windowHeight * 2; // 转换为rpx
    const buttonWidth = 100; // 按钮宽度
    const buttonHeight = 100; // 按钮高度

    // 左右边界
    newLeft = Math.max(0, Math.min(windowWidth - buttonWidth, newLeft));
    // 上下边界
    newBottom = Math.max(0, Math.min(windowHeight - buttonHeight, newBottom));

    // 更新位置
    this.setData({
      aiButtonLeft: newLeft,
      aiButtonBottom: newBottom,
      isDragging: true
    });

    // 更新起始位置，以便继续拖动
    this.startX = currentX;
    this.startY = currentY;
  },

  // 触摸结束事件
  onTouchEnd() {
    if (this.data.isDragging) {
      // 吸附到屏幕边缘
      const windowInfo = wx.getWindowInfo();
      const windowWidth = windowInfo.windowWidth * 2; // 转换为rpx
      const buttonWidth = 100; // 按钮宽度
      const centerX = windowWidth / 2;
      const currentLeft = this.data.aiButtonLeft;

      // 判断应该吸附到左边还是右边
      let finalLeft = currentLeft < centerX ? 0 : windowWidth - buttonWidth;

      // 动画吸附效果
      this.setData({
        aiButtonLeft: finalLeft,
        isDragging: false,
        preventPullDown: false
      });
    } else {
      // 如果不是拖动，也需要重置preventPullDown
      this.setData({
        preventPullDown: false
      });
    }
  }
});