Page({
  data: {
    role: 'user',
    userId: null,
    tempFilePath: '',
    hasPendingApplication: false, // 新增：是否有待审核的申请
  },

  onLoad: function (options) {
    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId) {
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
      return;
    }

    this.setData({
      userId: loginState.userId,
      role: loginState.role || 'user'
    });

    // 可选：重新获取用户角色信息以确保是最新的
    this.getUserRole();
    
    // 新增：检查是否有待审核的申请
    this.checkPendingApplication();
  },

  // 新增：检查是否有待审核的申请
  checkPendingApplication: function () {
    const that = this;
    const db = wx.cloud.database();
    
    db.collection('merchant_applications')
      .where({
        userId: that.data.userId,
        status: 'pending'
      })
      .get()
      .then((queryRes) => {
        if (queryRes.data && queryRes.data.length > 0) {
          that.setData({
            hasPendingApplication: true
          });
        }
      })
      .catch((err) => {
        console.error('检查申请记录失败:', err);
      });
  },

  getUserRole: function () {
    const that = this;
    const db = wx.cloud.database();

    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    db.collection('users')
      .where({ userId: parseInt(that.data.userId) })
      .get()
      .then((queryRes) => {
        wx.hideLoading();
        if (queryRes.data.length > 0) {
          const userData = queryRes.data[0];
          const latestRole = userData.role || 'user';

          that.setData({
            role: latestRole
          });

          wx.setStorageSync('loginState', {
            ...wx.getStorageSync('loginState'),
            role: latestRole
          });
        } else {
          console.warn('用户信息不存在');
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('查询用户信息失败:', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      });
  },

  applyForMerchant: function () {
    const that = this;
    
    // 新增：检查是否有待审核的申请
    if (this.data.hasPendingApplication) {
      wx.showModal({
        title: '提示',
        content: '您已经有一个待审核的商家申请，请等待审核结果。',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }
    
    // 新增：也可以再次从数据库检查一次，确保数据一致性
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '检查申请状态...',
      mask: true
    });
    
    db.collection('merchant_applications')
      .where({
        userId: that.data.userId,
        status: 'pending'
      })
      .get()
      .then((queryRes) => {
        wx.hideLoading();
        
        if (queryRes.data && queryRes.data.length > 0) {
          that.setData({
            hasPendingApplication: true
          });
          wx.showModal({
            title: '提示',
            content: '您已经有一个待审核的商家申请，请等待审核结果。',
            showCancel: false,
            confirmText: '我知道了'
          });
          return;
        }
        
        // 如果没有待审核的申请，继续原来的流程
        // 先弹出申请原因输入框
        wx.showModal({
          title: '申请原因',
          editable: true,
          placeholderText: '请输入您申请成为商家的原因',
          success: function (reasonRes) {
            if (reasonRes.confirm && reasonRes.content) {
              const reason = reasonRes.content;
              
              // 然后选择图片
              wx.chooseImage({
                count: 1,
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success(res) {
                  const tempFilePaths = res.tempFilePaths;
                  that.setData({
                    tempFilePath: tempFilePaths[0]
                  });

                  that.uploadPhoto(tempFilePaths[0]).then((fileID) => {
                    that.submitMerchantApplication(fileID, reason);
                  }).catch((err) => {
                    console.error('上传照片失败:', err);
                    wx.showToast({
                      title: '上传照片失败',
                      icon: 'none'
                    });
                  });
                },
                fail(err) {
                  console.error('选择图片失败:', err);
                  wx.showToast({
                    title: '选择图片失败',
                    icon: 'none'
                  });
                }
              });
            } else if (reasonRes.confirm) {
              wx.showToast({
                title: '请输入申请原因',
                icon: 'none'
              });
            }
          }
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('检查申请记录失败:', err);
        wx.showToast({
          title: '检查申请状态失败',
          icon: 'none'
        });
      });
  },

  uploadPhoto(filePath) {
    console.log('开始上传照片，userId:', this.data.userId);

    return new Promise((resolve, reject) => {
      const { userId } = this.data;

      if (!userId) {
        reject(new Error('未找到用户ID'));
        return;
      }

      const timestamp = Date.now();
      const cloudPath = `merchant_applications/user_${userId}_${timestamp}.jpg`;

      console.log('上传到云存储路径:', cloudPath);

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (uploadRes) => {
          const fileID = uploadRes.fileID;
          console.log('图片上传成功:', fileID);
          resolve(fileID);
        },
        fail: (err) => {
          console.error('图片上传失败:', err);
          reject(err);
        }
      });
    });
  },

  submitMerchantApplication(fileID, reason) {
    const that = this;
    const db = wx.cloud.database();

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    db.collection('merchant_applications')
      .add({
        data: {
          userId: that.data.userId,
          status: 'pending',
          createdAt: new Date(),
          photo: fileID,
          reason: reason
        }
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '申请已提交',
          icon: 'success'
        });
        
        // 新增：提交成功后更新状态
        that.setData({
          hasPendingApplication: true
        });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('提交申请失败:', err);
        wx.showToast({
          title: '提交申请失败',
          icon: 'none'
        });
      });
  },

  viewApplicationRecords: function () {
    wx.navigateTo({
      url: '/packageProfile/pages/privilege/applications/applications'
    });
  }
});