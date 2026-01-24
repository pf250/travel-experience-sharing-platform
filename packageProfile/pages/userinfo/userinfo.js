Page({
  data: {
    avatarUrl: '',       // 用户头像（当前数据库中的头像）
    nickName: '',        // 用户昵称
    phone: '',           // 手机号
    name: '',            // 姓名
    sex: '',             // 性别
    registerTime: '',    // 注册时间
    userId: '',          // 用户唯一标识
    tempAvatarUrl: ''    // 临时头像路径（用户选择后但未保存）
  },

  /**
   * 生命周期函数：页面加载时触发
   */
  onLoad(options) {
    const userId = options.userId || '';
    const avatarUrl = decodeURIComponent(options.avatarUrl || '');
    const nickName = decodeURIComponent(options.nickName || '');

    if (!userId) {
      this.showError('未找到 userId', '加载失败，请重试');
      return;
    }

    // 直接设置初始数据，不处理上传逻辑
    this.setData({ 
      userId, 
      avatarUrl, 
      nickName 
    });

    // 加载数据库中的完整信息
    this.fetchUserInfo(userId);
  },

  /**
   * 查询用户信息
   */
  fetchUserInfo(userId) {
    wx.showLoading({ title: '加载中...', mask: true });
    const db = wx.cloud.database();
    db.collection('users')
      .where({ userId: parseInt(userId) })
      .get()
      .then((queryRes) => {
        wx.hideLoading();
        if (queryRes.data.length > 0) {
          const userData = queryRes.data[0];
          this.setData({
            avatarUrl: userData.avatarUrl,
            nickName: userData.nickName,
            phone: userData.phone,
            name: userData.name,
            sex: userData.sex,
            registerTime: userData.registerTime
              ? new Date(userData.registerTime).toLocaleString()
              : ''
          });
        } else {
          this.showError('用户信息不存在', '请完善个人信息');
        }
      })
      .catch((err) => {
        console.error('查询用户信息失败:', err);
        this.showError('加载失败，请重试');
      });
  },

  /**
   * 选择头像
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('选择的头像路径:', avatarUrl);
    
    const fileSystemManager = wx.getFileSystemManager();
    fileSystemManager.getFileInfo({
      filePath: avatarUrl,
      success: (fileInfo) => {
        const fileSizeInMB = fileInfo.size / (1024 * 1024);
        if (fileSizeInMB > 2) {
          this.showError('头像大小不能超过 2MB，请重新选择', 3000);
          return;
        }
        this.setData({ 
          tempAvatarUrl: avatarUrl, 
          avatarUrl: avatarUrl 
        });
        console.log('已设置临时头像路径');
      },
      fail: (err) => {
        console.error('获取文件信息失败:', err);
        this.showError('无法读取头像文件，请重试', 3000);
      }
    });
  },

  /**
   * 修改昵称
   */
  onNicknameBlur(e) {
    this.setData({ nickName: e.detail.value });
  },

  /**
   * 修改手机号
   */
  onPhoneBlur(e) {
    const inputValue = e.detail.value.trim();
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (phoneRegex.test(inputValue)) {
      this.setData({ phone: inputValue });
    } else {
      this.setData({ phone: '' });
      this.showError('请输入有效的手机号');
    }
  },

  /**
   * 修改姓名
   */
  onNameBlur(e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 修改性别
   */
  onSexChange(e) {
    const sex = ['男', '女'][e.detail.value];
    this.setData({ sex });
  },

  /**
   * 保存用户信息
   */
  handleSave() {
    const { userId, tempAvatarUrl, nickName, phone, name, sex, avatarUrl: currentAvatarUrl } = this.data;
    
    if (!nickName) {
      this.showError('请填写昵称');
      return;
    }
    if (!userId) {
      this.showError('保存失败，请重试');
      return;
    }
    
    wx.showLoading({ title: '保存中...', mask: true });

    // 1. 先获取用户数据以确保正确的文档ID
    const db = wx.cloud.database();
    
    db.collection('users')
      .where({ userId: parseInt(userId) })
      .get()
      .then((queryRes) => {
        if (queryRes.data.length === 0) {
          throw new Error('用户不存在');
        }
        
        const user = queryRes.data[0];
        console.log('找到用户文档，_id:', user._id);
        
        // 2. 处理头像上传（如果有新头像）
        const uploadPromise = tempAvatarUrl
          ? this.uploadAvatar(tempAvatarUrl)
          : Promise.resolve(currentAvatarUrl);
        
        return Promise.all([Promise.resolve(user), uploadPromise]);
      })
      .then(([user, newAvatarUrl]) => {
        console.log('处理后的头像路径:', newAvatarUrl);
        
        // 3. 检查数据是否有变化
        const hasChanges = 
          user.avatarUrl !== newAvatarUrl ||
          user.nickName !== nickName ||
          user.phone !== phone ||
          user.name !== name ||
          user.sex !== sex;
          
        console.log('数据是否有变化:', hasChanges);
        
        if (!hasChanges) {
          throw new Error('信息未发生变化');
        }
        
        // 4. 更新用户信息（使用文档ID确保准确更新）
        return db.collection('users').doc(user._id).update({
          data: {
            avatarUrl: newAvatarUrl,
            nickName,
            phone,
            name,
            sex
          }
        }).then(updateRes => {
          console.log('用户信息更新结果:', updateRes);
          return { user, newAvatarUrl, updateRes };
        });
      })
      .then(({ user, newAvatarUrl }) => {
        // 5. 更新页面数据
        this.setData({ 
          avatarUrl: newAvatarUrl,
          tempAvatarUrl: '' 
        });
        
        // 6. 用户信息保存成功
        wx.hideLoading();
        wx.showToast({ 
          title: '用户信息已保存', 
          icon: 'success',
          duration: 2000
        });
        
        // 7. 异步同步到其他集合（不阻塞主流程）
        this.syncOtherCollections(userId, nickName, newAvatarUrl)
          .then(syncResult => {
            console.log('同步结果:', syncResult);
            if (syncResult && syncResult.result && syncResult.result.code === 0) {
              const itemsUpdated = syncResult.result.stats?.items?.updated || 0;
              const postsUpdated = syncResult.result.stats?.posts?.updated || 0;
              if (itemsUpdated > 0 || postsUpdated > 0) {
                wx.showToast({
                  title: `已同步${itemsUpdated + postsUpdated}条相关数据`,
                  icon: 'none',
                  duration: 1500
                });
              }
            }
          })
          .catch(syncErr => {
            console.warn('同步失败:', syncErr);
            // 同步失败不影响主要功能
          });
        
        // 8. 跳转回个人页面
        setTimeout(() => {
          wx.reLaunch({
            url: `/pages/profile/profile?avatarUrl=${encodeURIComponent(newAvatarUrl)}&nickName=${encodeURIComponent(nickName)}&userId=${userId}`
          });
        }, 1500);
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('保存失败:', err);
        
        let errorMsg = '保存失败';
        if (err.message.includes('用户不存在')) {
          errorMsg = '用户信息不存在';
        } else if (err.message.includes('未发生变化')) {
          errorMsg = '信息未发生变化';
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        this.showError(errorMsg);
      });
  },

  /**
   * 同步到其他集合
   */
  syncOtherCollections(userId, nickName, avatarUrl) {
    console.log('开始同步数据，参数:', { userId, nickName, avatarUrl });
    
    return wx.cloud.callFunction({
      name: 'syncUserProfile',
      data: {
        userId: parseInt(userId),
        nickName: nickName,
        avatarUrl: avatarUrl
      }
    });
  },

  /**
   * 上传头像到云存储
   */
  uploadAvatar(filePath) {
    console.log('开始上传头像，userId:', this.data.userId);
    
    return new Promise((resolve, reject) => {
      const { userId } = this.data;
      
      if (!userId) {
        reject(new Error('未找到用户ID'));
        return;
      }
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const cloudPath = `avatars/user_${userId}_${timestamp}.jpg`;
      
      console.log('上传到云存储路径:', cloudPath);
      
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath,
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

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('loginState');
          this.setData({
            isLogin: false,
            avatarUrl: '',
            nickName: '',
            userId: ''
          });
          wx.showToast({ title: '已退出登录', icon: 'none' });
          wx.reLaunch({ url: '/pages/profile/profile' });
        }
      }
    });
  },

  /**
   * 显示错误提示
   */
  showError(message, duration = 2000) {
    console.error(message);
    wx.showToast({
      title: message,
      icon: 'none',
      duration: duration
    });
  }
});