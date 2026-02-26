// packageHome/pages/resource/resource.js
Page({
  data: {
    // 功能规划数据
    featureCategories: [
      {
        id: 'travel',
        name: '旅游服务',
        icon: '🌍',
        features: [
          {
            id: 'travel_1',
            name: '智能行程规划',
            description: '根据用户偏好和时间自动生成最佳旅游路线',
            status: 'planning',
            eta: 'Q3 2026',
            progress: 20
          },
          {
            id: 'travel_2',
            name: '景点语音导览',
            description: '提供景区智能语音讲解服务',
            status: 'development',
            eta: 'Q2 2026',
            progress: 45
          },
          {
            id: 'travel_3',
            name: '实时游客流量',
            description: '显示景区实时人流情况，避开拥挤',
            status: 'planning',
            eta: 'Q4 2026',
            progress: 10
          }
        ]
      },
      {
        id: 'social',
        name: '社交互动',
        icon: '🤝',
        features: [
          {
            id: 'social_1',
            name: '旅游同伴匹配',
            description: '基于兴趣和行程匹配旅游同伴',
            status: 'development',
            eta: 'Q3 2026',
            progress: 35
          },
          {
            id: 'social_2',
            name: '直播分享',
            description: '支持实时直播旅游体验',
            status: 'planning',
            eta: 'Q4 2026',
            progress: 15
          },
          {
            id: 'social_3',
            name: '旅游社区',
            description: '创建专属旅游兴趣社区',
            status: 'design',
            eta: 'Q3 2026',
            progress: 25
          }
        ]
      },
      {
        id: 'commerce',
        name: '商业服务',
        icon: '💼',
        features: [
          {
            id: 'commerce_1',
            name: '在线购票',
            description: '景区门票在线预订和支付',
            status: 'development',
            eta: 'Q2 2026',
            progress: 60
          },
          {
            id: 'commerce_2',
            name: '特产商城',
            description: '地方特产在线购买',
            status: 'design',
            eta: 'Q3 2026',
            progress: 30
          },
          {
            id: 'commerce_3',
            name: '旅游保险',
            description: '提供旅游保险服务',
            status: 'planning',
            eta: 'Q4 2026',
            progress: 10
          }
        ]
      },
      {
        id: 'tech',
        name: '科技创新',
        icon: '🚀',
        features: [
          {
            id: 'tech_1',
            name: 'AR导览',
            description: '增强现实景区导览体验',
            status: 'research',
            eta: 'Q1 2027',
            progress: 5
          },
          {
            id: 'tech_2',
            name: 'AI旅游助手',
            description: '智能旅游咨询和建议',
            status: 'planning',
            eta: 'Q4 2026',
            progress: 15
          },
          {
            id: 'tech_3',
            name: 'VR预览',
            description: '虚拟现实景区预览',
            status: 'research',
            eta: 'Q1 2027',
            progress: 8
          }
        ]
      }
    ]
  },

  onLoad() {
    console.log('资源库页面加载');
  },

  // 功能点击事件
  onFeatureTap(event) {
    const featureId = event.currentTarget.dataset.id;
    console.log('点击功能:', featureId);
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none'
    });
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
  }
})