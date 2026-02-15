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
  const updateDataComments = {};
  let hasUpdates = false;
  
  if (nickName !== undefined && nickName !== null) {
    updateDataItems.userNickname = nickName;
    updateDataPosts.nickName = nickName;
    updateDataComments.nickName = nickName;
    hasUpdates = true;
  }
  if (avatarUrl !== undefined && avatarUrl !== null) {
    updateDataItems.userAvatar = avatarUrl;
    updateDataPosts.avatarUrl = avatarUrl;
    updateDataComments.avatarUrl = avatarUrl;
    hasUpdates = true;
  }

  // 如果没有需要更新的字段，直接返回
  if (!hasUpdates) {
    return { 
      code: 0, 
      message: '无有效更新字段',
      stats: {
        items: { updated: 0 },
        posts: { updated: 0 },
        comments: { updated: 0 }
      }
    };
  }

  const db = cloud.database();

  try {
    // 先检查目标集合中是否存在该用户的数据
  // 尝试同时使用数字和字符串类型的userId进行查询，确保能够匹配到所有数据
  const [itemsCountRes, postsCountRes, commentsCountRes, commentsCountResStr] = await Promise.all([
    db.collection('items')
      .where({ userId: userId })
      .count(),
    db.collection('posts')
      .where({ userId: userId })
      .count(),
    db.collection('comments')
      .where({ userId: userId })
      .count(),
    db.collection('comments')
      .where({ userId: userId.toString() })
      .count()
  ]);

  // 计算评论总数
  const totalComments = commentsCountRes.total + commentsCountResStr.total;

  console.log(`用户 ${userId} 的数据统计: items=${itemsCountRes.total}, posts=${postsCountRes.total}, comments=${totalComments}`);

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
  
  // 同时更新数字类型和字符串类型的userId的评论
  if (totalComments > 0) {
    // 更新数字类型userId的评论
    if (commentsCountRes.total > 0) {
      updatePromises.push(
        db.collection('comments')
          .where({ userId: userId })
          .update({
            data: updateDataComments
          })
      );
    } else {
      updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
    }
    
    // 更新字符串类型userId的评论
    if (commentsCountResStr.total > 0) {
      updatePromises.push(
        db.collection('comments')
          .where({ userId: userId.toString() })
          .update({
            data: updateDataComments
          })
      );
    } else {
      updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
    }
  } else {
    // 如果没有评论，添加两个空的promise，保持数组长度一致
    updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
    updatePromises.push(Promise.resolve({ stats: { updated: 0 } }));
  }

  const [itemsResult, postsResult, commentsResultNum, commentsResultStr] = await Promise.all(updatePromises);
  
  // 计算评论更新总数
  const totalCommentsUpdated = commentsResultNum.stats.updated + commentsResultStr.stats.updated;

    // 返回结果
  return {
    code: 0,
    message: '同步成功',
    stats: {
      items: itemsResult.stats,
      posts: postsResult.stats,
      comments: { updated: totalCommentsUpdated }
    },
    details: {
      itemsCount: itemsCountRes.total,
      postsCount: postsCountRes.total,
      commentsCount: totalComments
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
      posts: { updated: 0 },
      comments: { updated: 0 }
    }
  };
  }
};