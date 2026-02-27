# 旅行体验分享平台（travel-experience-sharing-platform）
微信小程序旅游体验分享与社交互动平台毕设项目

## 目录
- [1. 背景研究与需求分析](#1-背景研究与需求分析)
- [2. 系统设计](#2-系统设计)
- [3. 技术栈](#3-技术栈)
- [4. 角色及功能实现](#4-角色及功能实现)
- [5. 用户文档与部署](#5-用户文档与部署)
- [6. 总结与未来工作](#6-总结与未来工作)
- [7. 核心功能开发](#7-核心功能开发)
- [8. 多角色权限系统设计](#8-多角色权限系统设计)
- [9. 数据库设计](#9-数据库设计)
- [10. 项目成果](#10-项目成果)
- [11. 实际效果图](#11-实际效果图)

## 1. 背景研究与需求分析
调查和分析在线旅游平台现状与需求。给出解决方案。

## 2. 系统设计
- 定义系统架构，包括前端、后端和数据库设计。
- 设计用户界面，注重友好的界面交互。

## 3. 技术栈

### 3.1 前端
- 微信小程序原生框架
- WXML + WXSS + JavaScript
- 微信小程序组件库

### 3.2 后端
- 微信云开发
- 云函数
- 云数据库

### 3.3 其他
- AI图文编辑API

## 4. 角色及功能实现
该系统有3个基本角色：普通用户、旅游景点单位人员、管理员等角色。

### 4.1 管理员功能
- 实现用户管理功能，包括用户登录、权限管理等。

### 4.2 普通用户功能
- 注册与登录，可通过手机号、身份证等注册，填写基本信息如姓名、性别。
- 个人信息管理，完善个人资料。
- 支持体验分享与社交互动、在线预约景区门票（不同景区）。
- 支持其他用户评论，咨询分享过的攻略。

### 4.3 旅游景点单位人员
- 可以推荐自己景区的内容：门票，优惠方案等等。

## 5. 用户文档与部署
选择合适的部署方式，并能对系统进行演示，编写用户手册。

## 6. 总结与未来工作
对整个项目进行总结，包括达成的目标、遇到的问题和解决方案。提出未来可能的拓展方向和优化建议。

---

## 以下为实际完成的功能

## 7. 核心功能开发

### 7.1 首页模块
- 实现轮播图展示、公告信息、功能入口（跳蚤市场、排行榜等）
- 热门景点推荐、精选帖子展示、优惠活动展示

### 7.2 景区模块
- 完成景区列表展示、详情页
- 浏览量统计与排序
- 支持在线预定门票

### 7.3 发布模块
- 实现闲置物品和旅游帖子发布功能
- 支持AI图文编辑功能

### 7.4 论坛模块
- 开发帖子列表展示、详情页
- 点赞评论系统
- 智能排序算法（新帖按时间，旧帖按点赞数）

### 7.5 个人中心
- 构建用户信息管理
- 我的帖子/商品/购票
- 特权系统（管理员、商家、普通用户）

## 8. 多角色权限系统设计

### 8.1 普通用户
- 实现注册与登录
- 实现个人信息修改
- 实现发布帖子和商品
- 实现浏览景区和论坛
- 实现景区在线预定门票和退票
- 实现论坛点赞和评论
- 实现查看我的发帖/商品/购票
- 实现申请成为商家权限

### 8.2 商家
- 包含普通用户的全部功能
- 实现景区信息管理功能
- 实现门票管理
- 实现发布优惠方案
- 实现门票销售情况一览

### 8.3 管理员
- 包含普通用户的全部功能
- 实现用户管理（禁言，解禁）
- 实现商家资质审核功能
- 实现景区信息管理功能

## 9. 数据库设计

### 9.1 数据库表结构
- **users**：用户数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | avatarUrl | string | 头像 |
  | 3 | nickName | string | 昵称 |
  | 4 | name | string | 姓名 |
  | 5 | phone | string | 手机 |
  | 6 | sex | string | 性别 |
  | 7 | role | string | 身份 |
  | 8 | registerTime | data | 注册时间 |
  | 9 | openid | string | 自动生成 |
  | 10 | userId | number | 账号 |
  | 11 | isSilenced | boolen | 禁言状态 |
  | 12 | silenceEndTime | date | 禁言结束时间 |
  | 13 | silenceReason | String | 禁言原因
- **banners**：轮播图数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | updatedAt | date | 更新时间 |
  | 3 | fileIDs | array | 图片链接
- **comments**：评论数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | data | 自动生成 |
  | 4 | userId | number | 账号 |
  | 5 | avatarUrl | string | 头像 |
  | 6 | nickName | string | 昵称 |
  | 7 | content | string | 内容 |
  | 8 | postId | string | 评论id |
  | 9 | parentId | string | 回复id
- **counters**：计数器数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | count | number | 计数器
- **discounts**：优惠活动数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | discountType | number | 类型 |
  | 5 | discountValue | number | 优惠价格 |
  | 6 | startTime | string | 开始时间 |
  | 7 | endTime | string | 结束之间 |
  | 8 | scenicId | string | 景区id |
  | 9 | ticketIds | array | 门票id |
  | 10 | title | string | 标题 |
  | 11 | updatedAt | date | 更新时间
- **items**：闲置物品数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | data | 自动生成 |
  | 4 | userId | number | 账号 |
  | 5 | userUrl | string | 头像 |
  | 6 | nickName | string | 昵称 |
  | 7 | images | array | 图片 |
  | 8 | category | string | 种类 |
  | 9 | description | string | 描述 |
  | 10 | location | string | 地址 |
  | 11 | price | number | 价格 |
  | 12 | shipping | string | 出货方式
- **likes**：点赞数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | postId | string | 帖子id |
  | 5 | userId | number | 用户id
- **merchant_applications**：商家申请数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | userId | number | 账号 |
  | 5 | photo | string | 图片 |
  | 6 | status | string | 审核状态 |
  | 7 | reviewedAt | string | 回复时间 |
  | 8 | reason | string | 申请原因 |
  | 9 | rejectReason | string | 拒绝原因
- **posts**：帖子数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | data | 自动生成 |
  | 4 | userId | number | 账号 |
  | 5 | avatarUrl | string | 头像 |
  | 6 | nickName | string | 昵称 |
  | 7 | images | array | 图片 |
  | 8 | title | string | 标题 |
  | 9 | description | string | 描述
- **scenic**：景区数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | userId | number | 账号 |
  | 5 | name | string | 景区名 |
  | 6 | description | string | 描述 |
  | 7 | address | string | 地址 |
  | 8 | contactPhone | string | 电话 |
  | 9 | images | array | 图片 |
  | 10 | status | string | 状态 |
  | 11 | updatedAt | date | 注册时间 |
  | 12 | deleted | boolen | 逻辑删除 |
  | 13 | deletedAt | date | 删除时间 |
  | 14 | deletedReason | string | 删除原因 |
  | 15 | viewCount | number | 浏览量
- **ticket**：门票数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | description | string | 描述 |
  | 5 | name | string | 票名 |
  | 6 | price | number | 价格 |
  | 7 | scenicId | string | 景区id |
  | 8 | status | number | 状态 |
  | 9 | stock | number | 库存 |
  | 10 | updatedAt | date | 更新时间
- **ticket_sales**：门票销售数据
  | 编号 | 字段名 | 数据类型 | 说明 |
  | --- | --- | --- | --- |
  | 1 | _id | string | 自动生成 |
  | 2 | openid | string | 自动生成 |
  | 3 | createdAt | date | 自动生成 |
  | 4 | discountAmount | number | 优惠总额 |
  | 5 | hasDiscount | boolean | 是否优惠 |
  | 6 | isDeleted | boolean | 逻辑删除 |
  | 7 | isRefunded | boolean | 是否退票 |
  | 8 | originalPrice | number | 原价 |
  | 9 | price | number | 现价 |
  | 10 | quantity | number | 数量 |
  | 11 | refundTime | date | 拒绝时间 |
  | 12 | scenicId | string | 景区id |
  | 13 | scenicName | string | 景区名字 |
  | 14 | status | number | 状态 |
  | 15 | ticketId | string | 门票id |
  | 16 | ticketName | string | 门票名称 |
  | 17 | totalPrice | number | 合计金额 |
  | 18 | updatedAt | date | 更新时间 |
  | 19 | userId | number | 用户id |
  | 20 | userName | string | 用户昵称

## 10. 项目成果
- 项目开源发布GitHub: [https://github.com/pf250/travel-experience-sharing-platform.git](https://github.com/pf250/travel-experience-sharing-platform.git)

---

## 11. 实际效果图

### 11.1 首页
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/b7b6daaf-3841-4f06-8951-8ff7b5edc2a0" />

### 11.2 景区页面
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/576e2fc4-6f72-4a7f-91cb-dee607ef9b7e" />

### 11.3 发布页面
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/c67765ac-e065-4b4e-96b4-6b8f42cbe4ab" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/94ef53fe-2c09-492d-8d28-0dee6aadee45" />

### 11.4 论坛页面
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/d5f3fa20-60a2-48b3-9825-a6967bf4ebeb" />

### 11.5 个人中心
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/45407250-31f0-409f-8a72-5d6441cfa88b" />

### 11.6 不同身份功能展示

#### 11.6.1 普通用户
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/07ec58ba-03de-4ed8-be23-22da0f683edf" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/3a838a56-160b-4cf9-8f6d-761e58ffad53" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/ff416617-7507-427e-af37-3910ce93a7bb" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/e88016d1-eb57-4c38-8a29-c59ef20bfa44" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/9916073b-61ec-4c07-9d3c-921b7a8fa118" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/b5c893a1-3fae-422e-a62f-51d72b62dee2" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/68fa7b4d-f575-443f-b300-5fcd4f3a2989" />



#### 11.6.2 商家
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/f53be576-03ab-4e42-89f4-9aa194463267" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/ec351c2d-ab01-4e8e-bd94-de6921db58ff" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/b8c3c459-673a-4453-b971-3185f998b7c6" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/0073ed46-384b-4326-8652-e0d431c473bd" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/66f02b2e-19e9-4f88-9a24-96d3b0dde57f" />

#### 11.6.3 管理员
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/2f20d7c4-7845-40f9-a4a3-ec54fdc4c5ec" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/930c25c8-b27c-44cf-af40-1a1fbfdddc6a" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/da3ce19a-97c4-4f49-a96e-30f4f66e3670" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/faa26b7a-f4b7-444d-9e2e-e49759bfc1ab" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/ed86f2b2-0332-4e32-9c9c-2de46a8b5fd1" />
<img width="209" height="452" alt="image" src="https://github.com/user-attachments/assets/46f67363-9785-48d7-8cc3-ca2ab2cb78be" />





