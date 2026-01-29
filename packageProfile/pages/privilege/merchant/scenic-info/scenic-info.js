// scenic-info.js - 页面逻辑（修改版）
Page({
  data: {
    // 景区信息
    scenic: {
      name: '',
      description: '',
      address: '',
      contactPhone: '',
      images: [],
      status: '营业'
    },
    
    // 状态选项
    statusOptions: ['营业', '关闭'],
    
    // 是否已有景区
    hasScenic: false,
    
    // 用户ID
    userId: '',
    
    // 景区ID（如果有）
    scenicId: null,
    
    // 加载状态
    isLoading: true
  },

  onLoad: function(options) {
    if (options.userId) {
      this.setData({
        userId: options.userId
      });
      
      // 根据userId查询是否已有景区
      this.queryScenicByUserId(options.userId);
    }
  },

  // 根据用户ID查询景区信息
  queryScenicByUserId: function(userId) {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '加载中...',
    });
    
    // 查询该用户管理的景区
    db.collection('scenic').where({
      userId: Number(userId)
    }).get({
      success: (res) => {
        wx.hideLoading();
        this.setData({
          isLoading: false
        });
        
        if (res.data && res.data.length > 0) {
          // 有景区数据，显示并进入编辑模式
          const scenicData = res.data[0];
          this.setData({
            scenic: scenicData,
            hasScenic: true,
            scenicId: scenicData._id
          });
        } else {
          // 没有景区数据，进入创建模式
          this.setData({
            hasScenic: false,
            scenicId: null
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
        console.error('查询失败:', err);
      }
    });
  },

  // 处理输入框变化
  handleInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`scenic.${field}`]: value
    });
  },

  // 处理状态选择
  handleStatusChange: function(e) {
    this.setData({
      'scenic.status': this.data.statusOptions[e.detail.value]
    });
  },

  // 选择图片
  chooseImage: function() {
    if (this.data.scenic.images.length >= 5) {
      wx.showToast({
        title: '最多上传5张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseMedia({
      count: 5 - this.data.scenic.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFiles.map(item => item.tempFilePath);
        const images = this.data.scenic.images.concat(tempFilePaths);
        
        this.setData({
          'scenic.images': images
        });
      }
    });
  },

  // 预览图片
  previewImage: function(e) {
    const current = e.currentTarget.dataset.url;
    wx.previewImage({
      current: current,
      urls: this.data.scenic.images
    });
  },

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.scenic.images;
    images.splice(index, 1);
    
    this.setData({
      'scenic.images': images
    });
  },

  // 保存景区信息
  saveScenicInfo: function() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    const db = wx.cloud.database();
    const scenicData = {
      ...this.data.scenic,
      userId: Number(this.data.userId),
      updatedAt: db.serverDate()
    };
    
    wx.showLoading({
      title: '保存中...',
    });
    
    if (this.data.hasScenic && this.data.scenicId) {
      // 更新现有景区
      db.collection('scenic').doc(this.data.scenicId).update({
        data: scenicData,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          
          // 更新本地状态
          this.setData({
            hasScenic: true
          });
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '更新失败',
            icon: 'error'
          });
          console.error('更新失败:', err);
        }
      });
    } else {
      // 创建新景区
      scenicData.createdAt = db.serverDate();
      
      db.collection('scenic').add({
        data: scenicData,
        success: (res) => {
          wx.hideLoading();
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
          
          // 更新本地状态，设为编辑模式
          this.setData({
            hasScenic: true,
            scenicId: res._id
          });
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '创建失败',
            icon: 'error'
          });
          console.error('创建失败:', err);
        }
      });
    }
  },

  // 表单验证
  validateForm: function() {
    const scenic = this.data.scenic;
    
    if (!scenic.name || scenic.name.trim() === '') {
      wx.showToast({
        title: '请输入景区名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!scenic.address || scenic.address.trim() === '') {
      wx.showToast({
        title: '请输入景区地址',
        icon: 'none'
      });
      return false;
    }
    
    if (scenic.contactPhone && !/^1[3-9]\d{9}$/.test(scenic.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 删除景区
  deleteScenic: function() {
    if (!this.data.scenicId) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个景区吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          
          wx.showLoading({
            title: '删除中...',
          });
          
          db.collection('scenic').doc(this.data.scenicId).remove({
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重置为创建模式
              this.setData({
                scenic: {
                  name: '',
                  description: '',
                  address: '',
                  contactPhone: '',
                  images: [],
                  status: '营业'
                },
                hasScenic: false,
                scenicId: null
              });
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
              console.error('删除失败:', err);
            }
          });
        }
      }
    });
  },

  // 重置表单（清除所有输入）
  resetForm: function() {
    this.setData({
      scenic: {
        name: '',
        description: '',
        address: '',
        contactPhone: '',
        images: [],
        status: '营业'
      }
    });
  }
});