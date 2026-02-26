# 旅行体验分享平台ER图

## 1. 用户信息实体图 (图4.1)

```mermaid
erDiagram
    USERS {
        string _id "自动生成"
        string avatarUrl "头像"
        string nickName "昵称"
        string name "姓名"
        string phone "手机"
        string sex "性别"
        string role "身份"
        date registerTime "注册时间"
        string openid "自动生成"
        number userId "账号"
        boolean isSilenced "禁言状态"
        date silenceEndTime "禁言结束时间"
        string silenceReason "禁言原因"
    }
```

## 2. 帖子信息实体图 (图4.2)

```mermaid
erDiagram
    POSTS {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number userId "账号"
        string avatarUrl "头像"
        string nickName "昵称"
        array images "图片"
        string title "标题"
        string description "描述"
    }
```

## 3. 商品信息实体图 (图4.3)

```mermaid
erDiagram
    ITEMS {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number userId "账号"
        string userUrl "头像"
        string nickName "昵称"
        array images "图片"
        string category "种类"
        string description "描述"
        string location "地址"
        number price "价格"
        string shipping "出货方式"
    }
```

## 4. 评论信息实体图 (图4.4)

```mermaid
erDiagram
    COMMENTS {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number userId "账号"
        string avatarUrl "头像"
        string nickName "昵称"
        string content "内容"
        string postId "评论id"
        string parentId "回复id"
    }
```

## 5. 权限申请实体图 (图4.5)

```mermaid
erDiagram
    MERCHANT_APPLICATIONS {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number userId "账号"
        string photo "图片"
        string status "审核状态"
        string reviewedAt "回复时间"
        string reason "申请原因"
        string rejectReason "拒绝原因"
    }
```

## 6. 景区信息实体图 (图4.6)

```mermaid
erDiagram
    SCENIC {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number userId "账号"
        string name "景区名"
        string description "描述"
        string address "地址"
        string contactPhone "电话"
        array images "图片"
        string status "状态"
        date updatedAt "注册时间"
        boolean deleted "逻辑删除"
        date deletedAt "删除时间"
        string deletedReason "删除原因"
        number viewCount "浏览量"
    }
```

## 7. 门票信息实体图 (图4.7)

```mermaid
erDiagram
    TICKET {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        string description "描述"
        string name "票名"
        number price "价格"
        string scenicId "景区id"
        number status "状态"
        number stock "库存"
        date updatedAt "更新时间"
    }
```

## 8. 优惠信息实体图 (图4.8)

```mermaid
erDiagram
    DISCOUNTS {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number discountType "类型"
        number discountValue "优惠价格"
        string startTime "开始时间"
        string endTime "结束之间"
        string scenicId "景区id"
        array ticketIds "门票id"
        string title "标题"
        date updatedAt "更新时间"
    }
```

## 9. 轮播图信息实体图 (图4.9)

```mermaid
erDiagram
    BANNERS {
        string _id "自动生成"
        date updatedAt "更新时间"
        array fileIDs "图片链接"
    }
```

## 10. 计数器信息实体图 (图4.10)

```mermaid
erDiagram
    COUNTERS {
        string _id "自动生成"
        number count "计数器"
    }
```

## 11. 点赞信息实体图 (图4.11)

```mermaid
erDiagram
    LIKES {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        string postId "帖子id"
        number userId "用户id"
    }
```

## 12. 门票销售信息实体图 (图4.12)

```mermaid
erDiagram
    TICKET_SALES {
        string _id "自动生成"
        string openid "自动生成"
        date createdAt "自动生成"
        number discountAmount "优惠总额"
        boolean hasDiscount "是否优惠"
        boolean isDeleted "逻辑删除"
        boolean isRefunded "是否退票"
        number originalPrice "原价"
        number price "现价"
        number quantity "数量"
        date refundTime "拒绝时间"
        string scenicId "景区id"
        string scenicName "景区名字"
        number status "状态"
        string ticketId "门票id"
        string ticketName "门票名称"
        number totalPrice "合计金额"
        date updatedAt "更新时间"
        number userId "用户id"
        string userName "用户昵称"
    }
```

## 实体关系图

```mermaid
erDiagram
    USERS ||--o{ POSTS : "发布"
    USERS ||--o{ ITEMS : "发布"
    USERS ||--o{ COMMENTS : "评论"
    USERS ||--o{ MERCHANT_APPLICATIONS : "申请"
    USERS ||--o{ LIKES : "点赞"
    USERS ||--o{ TICKET_SALES : "购买"
    SCENIC ||--o{ TICKET : "包含"
    TICKET ||--o{ TICKET_SALES : "销售"
    SCENIC ||--o{ DISCOUNTS : "发布"
    TICKET ||--o{ DISCOUNTS : "参与"
    POSTS ||--o{ COMMENTS : "包含"
    POSTS ||--o{ LIKES : "被点赞"
```