Page({
  data: {
    role: 'user', // 初始角色
    userId: null,
    tempFilePath: '' // 临时存储上传的照片路径
  },

  onLoad: function (options) {
    const loginState = wx.getStorageSync('loginState');
    if (!loginState || !loginState.userId) {
      wx.showToast({ title: '用户信息获取失败', icon: 'none' });
      return;
    }

    this.setData({
      userId: loginState.userId,
      role: loginState.role || 'user' // 使用从 loginState 中获取的角色
    });

    // 可选：重新获取用户角色信息以确保是最新的
    this.getUserRole();
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
          that.submitMerchantApplication(fileID);
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
  },

  uploadPhoto(filePath) {
    console.log('开始上传照片，userId:', this.data.userId);

    return new Promise((resolve, reject) => {
      const { userId } = this.data;

      if (!userId) {
        reject(new Error('未找到用户ID'));
        return;
      }

      // 生成唯一的文件名
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

  submitMerchantApplication(fileID) {
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
          status: 'pending', // 状态为待审核
          createdAt: new Date(),
          photo: fileID // 保存上传的照片fileID
        }
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '申请已提交',
          icon: 'success'
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
  }
});