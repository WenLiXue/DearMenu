# DearMenu 点菜应用规格说明

## 1. 项目概述

**项目名称**: DearMenu
**项目类型**: 移动端网页应用
**核心功能**: 为老婆日常点菜提供便捷的工具，支持菜品管理、收藏、历史记录和随机推荐
**目标用户**: 老婆大人

## 2. 技术栈

| 层级     | 技术                          |
| -------- | ----------------------------- |
| 前端     | React 18 + Ant Design Mobile + Vite |
| 后端     | Python FastAPI                |
| 数据库   | PostgreSQL 15 (Docker)        |
| 认证     | JWT Token                     |
| 状态管理 | Zustand                       |

## 3. 功能列表

### 3.1 用户系统

- [X] 用户注册（用户名 + 密码）
- [X] 用户登录（用户名 + 密码）
- [X] JWT Token 认证
- [X] 登录状态持久化

### 3.2 分类管理

- [X] 预设分类：零食、饮料、奶茶、水果、热菜、熟食
- [X] 添加自定义分类
- [X] 编辑分类名称/图标
- [X] 删除分类（级联删除菜品）

### 3.3 菜品管理

- [X] 添加菜品（名称、分类、标签、评分）
- [X] 编辑菜品信息
- [X] 删除菜品
- [X] 按分类筛选
- [X] 按名称搜索

### 3.4 收藏功能

- [X] 一键收藏/取消收藏
- [X] 收藏列表页
- [X] 显示收藏状态

### 3.5 历史记录

- [X] 记录每次点菜
- [X] 查看历史列表
- [X] 显示点菜时间

### 3.6 随机推荐

- [X] 从所有菜品随机选择
- [X] 从指定分类随机选择
- [X] 选中后记录到历史

### 3.7 智能推荐系统

- [X] 智能推荐列表（多因素加权算法）
  - 频率权重：最近点过的菜更可能再次想吃
  - 评分权重：评分高的菜优先推荐
  - 分类多样性：避免总是推荐同一分类
  - 时间因素：早餐、午餐、晚餐不同时段推荐不同类型
  - 随机性：保持一定随机性增加趣味
- [X] 收藏相似推荐（基于标签和分类的相似度）
- [X] 推荐反馈机制（喜欢/不喜欢）
- [X] 推荐结果缓存（10分钟）
- [X] 家庭成员点餐历史综合考虑

### 3.8 数据统计模块

- [X] 仪表盘统计数据（今日点餐、本周概览）
- [X] 本周趋势统计（每日明细、完成率）
- [X] 本月统计（热门分类 Top5、热门菜品 Top5）
- [X] 热门菜品排行（可配置 Top N）
- [X] 分类分析（菜品数、点餐次数、收藏数）
- [X] 基于 family_id 过滤的数据隔离

### 3.9 角色权限系统 (RBAC)

- [X] 用户角色：wife（老婆）/ husband（老公）
- [X] 注册时选择角色
- [X] 登录返回 token + role + family_id
- [X] 前端路由守卫 AuthGuard
- [X] 后端接口角色校验

### 3.10 家庭协作

- [X] 家庭创建（注册时）
- [X] 邀请码加入家庭（6位邀请码）
- [X] 数据按 family_id 隔离
- [X] 家庭成员查看

### 3.11 通知系统

- [X] 发送通知（支持多种类型）
- [X] 通知类型：系统通知、消息、任务状态变更、庆祝
- [X] 获取通知列表
- [X] 标记单条/全部已读
- [X] 删除通知
- [X] 获取未读数量

### 3.12 消息系统

- [X] 发送消息（家庭成员间即时消息）
- [X] 获取与某用户的对话历史
- [X] 获取所有会话列表
- [X] 标记消息已读
- [X] 获取未读消息数量
- [X] 发送消息后自动创建 Notification（类型为 message）

#### 前端实现

- [X] Messages.tsx - 会话列表页面
- [X] Chat.tsx - 聊天详情页面
- [X] messageStore - 消息状态管理
- [X] messages API - API 调用封装
- [X] /messages 路由 - 会话列表
- [X] /chat/:userId 路由 - 聊天详情
- [X] TabBar 消息入口

## 4. 数据库设计

### 表结构

```
families (家庭表)
├── id: UUID PRIMARY KEY
├── invite_code: TEXT UNIQUE (6位邀请码)
├── name: TEXT
└── created_at: TIMESTAMPTZ

users (用户表)
├── id: UUID PRIMARY KEY
├── username: TEXT UNIQUE NOT NULL
├── password_hash: TEXT NOT NULL
├── role: TEXT (wife/husband)
├── family_id: UUID REFERENCES families
└── created_at: TIMESTAMPTZ

categories (分类表)
├── id: UUID PRIMARY KEY
├── family_id: UUID NOT NULL REFERENCES families
├── name: TEXT NOT NULL
├── icon: TEXT
├── sort_order: INT DEFAULT 0
└── created_at: TIMESTAMPTZ

dishes (菜品表)
├── id: UUID PRIMARY KEY
├── family_id: UUID NOT NULL REFERENCES families
├── category_id: UUID REFERENCES categories
├── name: TEXT NOT NULL
├── tags: TEXT[]
├── rating: INT (1-5)
├── image_url: TEXT (菜品图片)
├── description: TEXT (菜品描述)
└── created_at: TIMESTAMPTZ

favorites (收藏表)
├── id: UUID PRIMARY KEY
├── family_id: UUID NOT NULL REFERENCES families
├── dish_id: UUID REFERENCES dishes
└── created_at: TIMESTAMPTZ

order_history (历史记录表)
├── id: UUID PRIMARY KEY
├── family_id: UUID NOT NULL REFERENCES families
├── dish_id: UUID REFERENCES dishes
├── status: TEXT DEFAULT 'pending' (pending/cooking/completed)
├── cooked_at: TIMESTAMPTZ (完成时间)
└── created_at: TIMESTAMPTZ

notifications (通知表)
├── id: UUID PRIMARY KEY
├── user_id: UUID NOT NULL REFERENCES users (接收通知的用户)
├── sender_id: UUID REFERENCES users (发送者，可为null表示系统通知)
├── family_id: UUID NOT NULL REFERENCES families
├── type: TEXT NOT NULL (notification/message/task/celebration)
├── title: TEXT NOT NULL
├── content: TEXT
├── is_read: BOOLEAN DEFAULT FALSE
└── created_at: TIMESTAMPTZ

messages (消息表)
├── id: UUID PRIMARY KEY
├── sender_id: UUID NOT NULL REFERENCES users (发送者)
├── receiver_id: UUID NOT NULL REFERENCES users (接收者)
├── family_id: UUID NOT NULL REFERENCES families
├── content: TEXT NOT NULL
├── is_read: BOOLEAN DEFAULT FALSE
└── created_at: TIMESTAMPTZ

recommendation_feedback (推荐反馈表)
├── id: UUID PRIMARY KEY
├── user_id: UUID NOT NULL REFERENCES users (用户)
├── dish_id: UUID NOT NULL REFERENCES dishes (菜品)
├── feedback: TEXT NOT NULL (like/dislike)
└── created_at: TIMESTAMPTZ
```

## 5. API 接口

### 认证

- `POST /api/auth/register` - 注册（支持角色选择、家庭创建/加入）
- `POST /api/auth/login` - 登录（返回 token + role + family_id）

### 家庭

- `GET /api/families/{id}` - 获取家庭信息
- `POST /api/families/join` - 通过邀请码加入家庭
- `GET /api/families/{id}/members` - 获取家庭成员
- `POST /api/families/generate-code` - 生成新邀请码

### 分类

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/{id}` - 更新分类
- `DELETE /api/categories/{id}` - 删除分类

### 菜品

- `GET /api/dishes` - 获取菜品列表
- `GET /api/dishes?category_id=xxx` - 按分类获取
- `POST /api/dishes` - 创建菜品
- `PUT /api/dishes/{id}` - 更新菜品
- `DELETE /api/dishes/{id}` - 删除菜品

### 收藏

- `GET /api/favorites` - 获取收藏列表
- `POST /api/favorites/{dish_id}` - 添加收藏
- `DELETE /api/favorites/{dish_id}` - 取消收藏

### 历史

- `GET /api/history` - 获取历史记录

### 通知

- `POST /api/notifications` - 发送通知
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/{id}/read` - 标记已读
- `PUT /api/notifications/read-all` - 全部标记已读
- `DELETE /api/notifications/{id}` - 删除通知
- `GET /api/notifications/unread-count` - 获取未读数量

### 消息

- `POST /api/messages` - 发送消息
- `GET /api/messages?conversation_with={user_id}` - 获取与某用户的对话
- `GET /api/messages/conversations` - 获取所有会话列表
- `PUT /api/messages/{id}/read` - 标记消息已读
- `GET /api/messages/unread-count` - 获取未读消息数量

### 随机

- `GET /api/random` - 随机推荐
- `GET /api/random?category_id=xxx` - 指定分类随机

### 智能推荐

- `GET /api/recommendations` - 获取智能推荐列表（多因素加权算法）
- `GET /api/recommendations/random` - 获取随机推荐（保留现有功能）
- `GET /api/recommendations/favorites` - 推荐类似的收藏菜品
- `POST /api/recommendations/feedback` - 用户反馈（喜欢/不喜欢某推荐）
- `GET /api/recommendations/stats` - 获取推荐统计数据

### 老公端

- `GET /api/husband/tasks` - 获取今日任务
- `PUT /api/husband/tasks/{id}/status` - 更新任务状态
- `GET /api/husband/favorites` - 获取老婆喜欢的菜
- `GET /api/husband/history` - 获取已完成历史
- `POST /api/husband/message` - 发送消息通知老婆

### 管理员后台

- `GET /api/admin/dishes` - 获取所有菜品（支持分页、搜索）
- `POST /api/admin/dishes` - 创建菜品
- `PUT /api/admin/dishes/{id}` - 更新菜品
- `DELETE /api/admin/dishes/{id}` - 删除菜品
- `GET /api/admin/categories` - 获取所有分类
- `POST /api/admin/categories` - 创建分类
- `PUT /api/admin/categories/{id}` - 更新分类
- `DELETE /api/admin/categories/{id}` - 删除分类
- `GET /api/admin/favorites` - 获取所有收藏
- `GET /api/admin/history` - 获取历史记录
- `GET /api/admin/stats` - 获取统计数据

### 数据统计

- `GET /api/stats/dashboard` - 仪表盘统计数据（今日、本周概览）
- `GET /api/stats/weekly` - 本周详细统计数据
- `GET /api/stats/monthly` - 本月统计数据
- `GET /api/stats/top-dishes` - 热门菜品 Top N
- `GET /api/stats/category-analysis` - 分类分析统计

## 6. UI/UX 设计方向

### 风格

- 高端精致
- 简洁大方
- 移动端优先

### 配色

- 主色：柔和的暖色调
- 背景：浅色系
- 强调色：金色/玫瑰金点缀

### 布局

- 底部 Tab 导航：首页、分类、菜品、收藏、我的
- 卡片式展示
- 流畅动画

## 7. 页面列表

### 用户端页面

1. **Login** - 登录页
2. **Register** - 注册页
3. **Home** - 首页（今日推荐、快速点菜）
4. **Categories** - 分类管理
5. **Dishes** - 菜品列表
6. **DishForm** - 菜品编辑/添加
7. **Favorites** - 收藏列表
8. **History** - 历史记录
9. **RandomPick** - 随机选择器

### 老公端页面（/husband）

10. **HusbandPage** - 老公端首页
    - 今日任务展示（状态流转：pending→cooking→completed）
    - 快捷操作（随机做、优先做她喜欢的、今天偷懒）
    - 完成后反馈互动
    - 空状态展示
11. **HusbandHistory** - 老公端历史记录

### 管理员后台（/admin）

12. **Dashboard** - 仪表盘（统计数据）
13. **DishManage** - 菜品管理（CRUD、搜索、筛选、分页）
14. **CategoryManage** - 分类管理
15. **FavoriteManage** - 收藏管理
16. **HistoryManage** - 历史记录
17. **Settings** - 系统设置

## 8. 状态管理

使用 Zustand 管理：

- `authStore` - 用户认证状态（包含 role、familyId）
- `categoryStore` - 分类数据
- `dishStore` - 菜品数据
- `favoriteStore` - 收藏数据

## 9. 权限体系

### 角色定义

| 角色 | 说明 | 可访问页面 |
|------|------|-----------|
| wife | 老婆，点餐用户 | /home, /dishes, /favorites, /history 等 |
| husband | 老公，执行任务 | /husband, /husband/history |
| admin | 管理员 | /admin/* |

### 数据隔离

- 以 family_id 为数据域隔离维度
- 同一家庭成员共享菜品、分类、收藏、历史数据
- 不同家庭之间数据完全隔离
- `require_family` 依赖确保用户已加入家庭

### 后端依赖

| 依赖 | 说明 |
|------|------|
| `get_current_user` | JWT Token 验证，获取当前用户 |
| `require_role(*roles)` | 角色校验装饰器 |
| `require_family` | 家庭校验依赖，确保用户已加入家庭 |

### 前端路由守卫

使用 AuthGuard 组件进行路由级权限控制：
- 无 token → 重定向 /login
- 角色不匹配 → 重定向对应角色首页

为提升系统的完整性与用户体验，项目在原有功能基础上新增了角色体系、家庭绑定机制与任务系统，实现多用户协作与数据隔离。同时引入通知系统与互动消息模块，增强用户之间的实时沟通与情感连接。

此外，通过推荐系统与数据统计模块对用户行为进行分析，进一步提升系统的智能化水平与可扩展性，使其从单一工具型应用升级为具备社交属性的协作型产品。
