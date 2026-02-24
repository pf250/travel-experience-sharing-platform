// pages/attraction/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scenic: null,
    tickets: [],
    discounts: [],
    isLoading: true,
    currentImageIndex: 0,
    showFullDescription: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const scenicId = options.id;
    if (scenicId) {
      this.queryScenicDetail(scenicId);
      this.queryTicketsByScenicId(scenicId);
      this.queryDiscountsByScenicId(scenicId);
    }
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
   * 查询景区详情
   */
  queryScenicDetail(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('scenic').doc(scenicId).get({
      success: (res) => {
        // 为景区数据添加格式化后的浏览量
        const scenicData = res.data;
        const formattedViewCount = this.formatViewCount(scenicData.viewCount || 0);
        this.setData({
          scenic: {
            ...scenicData,
            formattedViewCount
          }
        });
        console.log('查询景区详情成功:', res.data);
        
        // 更新景区浏览量
        db.collection('scenic').doc(scenicId).update({
          data: {
            viewCount: db.command.inc(1)
          },
          success: (updateRes) => {
            console.log('浏览量更新成功');
            // 计算更新后的浏览量
            const updatedViewCount = (res.data.viewCount || 0) + 1;
            const updatedFormattedViewCount = this.formatViewCount(updatedViewCount);
            // 更新当前页面的浏览量显示
            this.setData({
              scenic: {
                ...res.data,
                viewCount: updatedViewCount,
                formattedViewCount: updatedFormattedViewCount
              }
            });
            // 通知上一个页面更新对应景区的浏览量
            const pages = getCurrentPages();
            if (pages.length > 1) {
              const prevPage = pages[pages.length - 2];
              if (prevPage.updateScenicViewCount) {
                prevPage.updateScenicViewCount(scenicId, updatedViewCount);
              }
            }
          },
          fail: (updateErr) => {
            console.error('浏览量更新失败:', updateErr);
          }
        });
        
        this.setLoading(false);
      },
      fail: (err) => {
        console.error('查询景区详情失败:', err);
        wx.showToast({
          title: '加载景区信息失败',
          icon: 'error'
        });
        this.setLoading(false);
      }
    });
  },

  /**
   * 根据景区ID查询门票
   */
  queryTicketsByScenicId(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('ticket').where({
      scenicId: scenicId,
      status: 1
    }).get({
      success: (res) => {
        this.setData({
          tickets: res.data
        });
        console.log('查询门票成功:', res.data.length, '张');
      },
      fail: (err) => {
        console.error('查询门票失败:', err);
      }
    });
  },

  /**
   * 根据景区ID查询优惠方案
   */
  queryDiscountsByScenicId(scenicId) {
    const db = wx.cloud.database();
    
    db.collection('discounts').where({
      scenicId: scenicId
    }).get({
      success: (res) => {
        // 计算优惠状态
        const now = new Date();
        const discountsWithStatus = res.data.map(discount => {
          // 解析开始时间
          const startParts = discount.startTime.split(/[- :]/);
          const startTime = new Date(startParts[0], startParts[1] - 1, startParts[2], startParts[3], startParts[4]);
          // 解析结束时间
          const endParts = discount.endTime.split(/[- :]/);
          const endTime = new Date(endParts[0], endParts[1] - 1, endParts[2], endParts[3], endParts[4]);
          
          let status = 0;
          if (now < startTime) {
            status = 0; // 未开始
          } else if (now >= startTime && now <= endTime) {
            status = 1; // 进行中
          } else {
            status = 2; // 已结束
          }
          
          return {
            ...discount,
            status: status
          };
        });
        
        this.setData({
          discounts: discountsWithStatus
        });
        console.log('查询优惠方案成功:', discountsWithStatus.length, '个');
        
        // 为门票添加优惠信息
        this.addDiscountInfoToTickets();
      },
      fail: (err) => {
        console.error('查询优惠方案失败:', err);
      }
    });
  },

  /**
   * 设置加载状态
   */
  setLoading(isLoading) {
    this.setData({
      isLoading: isLoading
    });
  },

  /**
   * 切换图片
   */
  changeImage(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  /**
   * 拨打电话
   */
  makePhoneCall() {
    const phoneNumber = this.data.scenic.contactPhone;
    if (phoneNumber) {
      wx.makePhoneCall({
        phoneNumber: phoneNumber
      });
    }
  },

  /**
   * 导航到地图
   */
  openLocation() {
    const scenic = this.data.scenic;
    const address = scenic.address;
    
    if (address) {
      // 先复制地址到剪贴板
      wx.setClipboardData({
        data: address,
        success: () => {
          wx.showToast({
            title: '地址已复制到剪贴板',
            icon: 'success'
          });
          
          // 然后打开微信内置地图
          if (scenic.latitude && scenic.longitude) {
            // 有经纬度时直接打开微信内置地图
            wx.openLocation({
              latitude: scenic.latitude,
              longitude: scenic.longitude,
              address: address,
              name: scenic.name,
              success: (res) => {
                console.log('打开地图成功:', res);
              },
              fail: (err) => {
                console.error('打开地图失败:', err);
                wx.showToast({
                  title: '打开地图失败',
                  icon: 'none'
                });
              }
            });
          } else {
            // 无经纬度时让用户在微信内置地图中选择位置
            wx.chooseLocation({
              success: (res) => {
                // 用户选择位置后打开地图
                wx.openLocation({
                  latitude: res.latitude,
                  longitude: res.longitude,
                  address: address,
                  name: scenic.name,
                  success: (res) => {
                    console.log('打开地图成功:', res);
                  },
                  fail: (err) => {
                    console.error('打开地图失败:', err);
                    wx.showToast({
                      title: '打开地图失败',
                      icon: 'none'
                    });
                  }
                });
              },
              fail: (err) => {
                console.error('选择位置失败:', err);
                wx.showToast({
                  title: '选择位置失败',
                  icon: 'none'
                });
              }
            });
          }
        },
        fail: (err) => {
          console.error('复制地址失败:', err);
          wx.showToast({
            title: '复制地址失败',
            icon: 'none'
          });
          
          // 即使复制失败也尝试打开地图
          if (scenic.latitude && scenic.longitude) {
            wx.openLocation({
              latitude: scenic.latitude,
              longitude: scenic.longitude,
              address: address,
              name: scenic.name
            });
          } else {
            wx.chooseLocation({
              success: (res) => {
                wx.openLocation({
                  latitude: res.latitude,
                  longitude: res.longitude,
                  address: address,
                  name: scenic.name
                });
              }
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '暂无地址信息',
        icon: 'none'
      });
    }
  },
  
  /**
   * 切换景区描述展开/收起状态
   */
  toggleDescription() {
    this.setData({
      showFullDescription: !this.data.showFullDescription
    });
  },

  /**
   * 获取优惠后的价格
   */
  getDiscountedPrice(ticketId, originalPrice) {
    const discounts = this.data.discounts.filter(discount => {
      return discount.status === 1 && discount.ticketIds.includes(ticketId);
    });
    
    if (discounts.length > 0) {
      // 取第一个有效的优惠方案
      const discount = discounts[0];
      // 计算优惠后的价格
      const discountedPrice = originalPrice - discount.discountValue;
      return Math.max(0, discountedPrice); // 确保价格不小于0
    }
    return null;
  },
  
  /**
   * 为门票添加优惠信息
   */
  addDiscountInfoToTickets() {
    const ticketsWithDiscount = this.data.tickets.map(ticket => {
      const discountedPrice = this.getDiscountedPrice(ticket._id, ticket.price);
      return {
        ...ticket,
        discountedPrice: discountedPrice,
        hasDiscount: discountedPrice !== null
      };
    });
    
    this.setData({
      tickets: ticketsWithDiscount
    });
  },

  /**
   * 预定门票
   */
  bookTicket(e) {
    const ticketId = e.currentTarget.dataset.ticketId;
    const ticketName = e.currentTarget.dataset.ticketName;
    const ticketPrice = e.currentTarget.dataset.ticketPrice;
    
    // 查找对应的门票信息
    const ticket = this.data.tickets.find(t => t._id === ticketId);
    if (!ticket) {
      wx.showToast({
        title: '门票信息不存在',
        icon: 'error'
      });
      return;
    }
    
    // 检查库存
    if (ticket.stock <= 0) {
      wx.showToast({
        title: '门票已售罄',
        icon: 'error'
      });
      return;
    }
    
    // 显示预定模态框
    wx.showModal({
      title: '预定门票',
      content: `您确定要预定 ${ticketName} 吗？\n价格：¥${ticketPrice}`,
      success: (res) => {
        if (res.confirm) {
          // 这里可以实现具体的预定逻辑，比如创建订单
          // 暂时模拟预定成功
          wx.showToast({
            title: '预定成功',
            icon: 'success'
          });
          
          // 可以跳转到订单页面或其他相关页面
          // wx.navigateTo({ url: '/pages/order/order' });
        }
      }
    });
  }
})