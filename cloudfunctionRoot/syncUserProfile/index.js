const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { userId, nickName, avatarUrl } = event;

  // 参数校验
  if (typeof userId !== 'number') {
    throw new Error('userId 必须为数字类型');
  }

  // 过滤无效字段
  const updateDataItems = {};
  const updateDataPosts = {};
  let hasUpdates = false;
  
  if (nickName !== undefined && nickName !== null) {
    updateDataItems.userNickname = nickName;
    updateDataPosts.nickName = nickName;
    hasUpdates = true;
  }
  if (avatarUrl !== undefined && avatarUrl !== null) {
    updateDataItems.userAvatar = avatarUrl;
    updateDataPosts.avatarUrl = avatarUrl;
    hasUpdates = true;
  }

  // 如果没有需要更新的字段，直接返回
  if (!hasUpdates) {
    return { 
      code: 0, 
      message: '无有效更新字段',
      stats: {
        items: { updated: 0 },
        posts: { updated: 0 }
      }
    };
  }

  const db = cloud.database();

  try {
    // 先检查目标集合中是否存在该用户的数据
    const [itemsCountRes, postsCountRes] = await Promise.all([
      db.collection('items')
        .where({ userId: userId })
        .count(),
      db.collection('posts')
        .where({ userId: userId })
        .count()
    ]);

    console.log(`用户 ${userId} 的数据统计: items=${itemsCountRes.total}, posts=${postsCountRes.total}`);

    // 执行更新操作（只有存在数据的集合才需要更新）
    const updatePromises = [];
    
    if (itemsCountRes.total > 0) {
      updatePromises.push(
        db.collection('items')
          .where({ userId: userId })
          .update({
            data: updateDataItems
          })
      );
    } else {
      updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
    }
    
    if (postsCountRes.total > 0) {
      updatePromises.push(
        db.collection('posts')
          .where({ userId: userId })
          .update({
            data: updateDataPosts
          })
      );
    } else {
      updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
    }

    const [itemsResult, postsResult] = await Promise.all(updatePromises);

    // 返回结果
    return {
      code: 0,
      message: '同步成功',
      stats: {
        items: itemsResult.stats,
        posts: postsResult.stats
      },
      details: {
        itemsCount: itemsCountRes.total,
        postsCount: postsCountRes.total
      }
    };
  } catch (err) {
    console.error('同步失败:', err);
    
    // 部分失败的处理：记录错误但不抛出，让前端知道同步状态
    return {
      code: 1,
      message: '同步部分失败',
      error: err.message,
      stats: {
        items: { updated: 0 },
        posts: { updated: 0 }
      }
    };
  }
};