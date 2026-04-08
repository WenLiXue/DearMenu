# DearMenu 产品说明书

> 版本: v5.0
> 更新日期: 2026-04-08
> 产品定位: 情侣协作式点餐系统

---

## 一、产品概述

### 1.1 产品简介

DearMenu（亲爱的菜单）是一款专为情侣设计的协作式点餐应用。「老婆」负责决策点餐，「老公」负责执行制作，通过通知推送实现实时协作。

### 1.2 核心角色

| 角色 | 定位 | 主要操作 |
|------|------|----------|
| 老婆 (wife) | 决策者 | 点餐、收藏、管理分类 |
| 老公 (husband) | 执行者 | 接收任务、制作餐食、完成反馈 |
| 管理员 (admin) | 系统维护 | 数据管理、统计查看 |

### 1.3 技术架构

| 层级 | 技术选型 |
|------|----------|
| 前端 | React 18 + Ant Design Mobile + Vite + Zustand |
| 后端 | Python FastAPI + SQLAlchemy |
| 数据库 | PostgreSQL 15 (Docker) |
| 认证 | JWT Token |
| 实时通知 | 轮询 + WebSocket（未来） |

---

## 二、功能全景图

```
┌─────────────────────────────────────────────────────────────┐
│                        DearMenu                              │
├─────────────┬─────────────────┬─────────────────┬────────────┤
│   老婆端    │     老公端      │     管理端       │   系统     │
├─────────────┼─────────────────┼─────────────────┼────────────┤
│ 首页推荐    │ 今日任务        │ 仪表盘          │ 通知推送   │
│ 菜品浏览    │ 开始制作        │ 菜品管理        │ 消息系统   │
│ 分类管理    │ 完成制作        │ 分类管理        │ 智能推荐   │
│ 收藏管理    │ 任务历史        │ 收藏管理        │ 数据统计   │
│ 订单管理    │ 拒绝/取消       │ 历史记录        │            │
│ 历史记录    │                 │                 │            │
│ 消息聊天    │                 │                 │            │
└─────────────┴─────────────────┴─────────────────┴────────────┘
```

---

## 三、老婆端功能

### 3.1 首页 (/)

**设计目标**: 首屏完整展示，无需滚动

```
┌─────────────────────────────┐
│ 今天吃什么呀？               │ ← NavBar
├─────────────────────────────┤
│ 早上好 ☀️ 亲爱的            │ ← 问候区（动态时段）
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     🍳 番茄炒蛋          │ │ ← 今日推荐卡片
│ │     ★★★★☆               │ │    flex:1 自适应
│ │     上次: 3天前          │ │    心跳动画
│ │  [就吃这个] [换一道]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  点餐   分类   收藏   随机  │ ← 功能4宫格
├─────────────────────────────┤
│ 🏠 🍽️ 📋 ❤️ 👤             │ ← TabBar
└─────────────────────────────┘
```

**功能说明**:
- 问候语根据时段变化：早上好/上午好/中午好/下午好/晚上好/夜深了
- 今日推荐基于智能推荐算法（评分高+收藏多+最近未吃）
- 点击「就吃这个」直接下单，点击「换一道」刷新推荐

### 3.2 点餐 (/dishes)

**功能**:
- 按分类筛选菜品
- 查看菜品详情（名称、标签、评分）
- 一键收藏/取消收藏
- 点击下单

**TabBar 显示**: 首页、点餐、订单、收藏、我的

### 3.3 订单 (/orders)

**功能**:
- 查看所有订单（待处理/制作中/已完成/已拒绝/已取消）
- 催单提醒（发送通知给老公）
- 取消订单（仅待处理状态）

**状态流转**:
```
PENDING ──老公接受──→ COOKING ──老公完成──→ COMPLETED
    │                         │
    │老公拒绝                 │老公拒绝
    ↓                         ↓
 REJECTED                   REJECTED

PENDING ──老婆取消──→ CANCELLED
```

### 3.4 收藏 (/favorites)

- 查看收藏的菜品列表
- 点击菜品快速下单
- 取消收藏

### 3.5 分类管理 (/categories)

**功能**:
- 查看所有分类
- 添加新分类
- 编辑分类名称/图标
- 删除分类（级联删除菜品）
- 同家庭内分类名称唯一约束

**预设分类**: 零食🍪、饮料🥤、奶茶🧋、水果🍎、热菜🍳、熟食🍖

### 3.6 消息 (/messages)

- 会话列表（显示未读数）
- 进入聊天页面
- 发送消息给老公
- 消息发送后自动创建通知

---

## 四、老公端功能

### 4.1 任务首页 (/husband)

**设计风格**: 简洁、任务导向、薄荷绿主题

```
┌─────────────────────────────┐
│ 老公的任务中心    [薄荷绿渐变]│ ← NavBar
├─────────────────────────────┤
│  当前任务 (COOKING)         │
│ ┌─────────────────────────┐ │
│ │  番茄炒蛋                │ │ ← 主任务卡
│ │  ████████░░░░ 60%      │ │    进度条动画
│ │  [完成]                  │ │
│ └─────────────────────────┘ │
│                             │
│  待处理 (3)                 │ ← 折叠区
│ ├ 蛋炒饭                    │
│ ├ 宫保鸡丁                  │
│ └ 麻婆豆腐                  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 今日成就                  │ │ ← 情绪模块
│ │ 已完成 2/5 道 💪          │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│    📋任务   📊历史   👤我的 │ ← TabBar
└─────────────────────────────┘
```

### 4.2 任务操作

| 操作 | 说明 | 触发通知 |
|------|------|----------|
| 接受订单 | PENDING → COOKING | "开始制作啦 👨‍🍳" |
| 拒绝订单 | PENDING/COOKING → REJECTED（需填理由） | "订单被拒绝了 😢" |
| 完成制作 | COOKING → COMPLETED | "做好啦！快来尝尝 🎉" |

### 4.3 催单反馈

老公未及时处理时，老婆可发送催单：
- 第1次催单：温柔语气 "老婆等好久了呢～"
- 第2次催单：可爱语气 "再不做饭要生气啦！"
- 第3次催单：催促语气 "催催催！🔥"

### 4.4 空状态

无待处理任务时显示：
```
🎉 今天没有任务！
可以休息一下，或者：
[ 🎲 随机做点好吃的 ]
```

### 4.5 历史 (/husband/history)

- 查看已完成的任务列表
- 显示完成时间和菜品

---

## 五、管理端功能 (/admin)

**设计风格**: 蓝色系、工具化、高效

### 5.1 仪表盘

- **统计卡片**: 菜品总数、分类总数、收藏总数、历史记录
- **今日/本周/本月 Tab**: 切换不同时间维度的统计
- **本周趋势图**: 柱状图展示每日点餐量
- **热门菜品 Top5**: 按点餐次数排序
- **分类分析**: 各分类的菜品数、点餐数、收藏数

### 5.2 菜品管理

**功能**:
- 菜品列表（分页、搜索、分类筛选）
- 新增/编辑/删除菜品
- 表单字段：菜名、图片、分类、标签、评分、描述

### 5.3 分类管理

- 分类列表
- 新增/编辑/删除分类

### 5.4 收藏管理

- 查看所有收藏
- 标记推荐

### 5.5 历史记录

- 查看点餐历史
- 显示时间、菜品、完成状态

### 5.6 系统设置

- 管理员密码修改

---

## 六、智能推荐系统

### 6.1 推荐算法

多因素加权推荐，权重配置：

| 因素 | 权重 | 说明 |
|------|------|------|
| 评分 | 1.5 | 1-5星归一化 |
| 收藏 | 2.0 | 收藏的菜加分 |
| 最近未吃 | 1.8 | 超过7天未吃的菜加分 |
| 分类多样性 | 1.0 | 同分类最多推荐3道 |
| 随机性 | 0.5 | 避免推荐固化 |

### 6.2 时段推荐

| 时段 | 推荐关键词 |
|------|-----------|
| 早餐 (5-10点) | 粥、包子、馒头、饼、鸡蛋 |
| 午餐 (10-14点) | 米饭、面、炒菜、快餐 |
| 下午茶 (14-17点) | 奶茶、咖啡、水果、甜点 |
| 晚餐 (17-21点) | 热菜、家常菜、炒菜、炖菜 |
| 夜宵 (21-5点) | 夜宵、烧烤、小吃 |

### 6.3 推荐反馈

- 喜欢/不喜欢反馈
- 反馈数据影响后续推荐

---

## 七、通知系统

### 7.1 通知类型

| 类型 | 用途 |
|------|------|
| task | 点餐请求、制作状态变更 |
| message | 新消息提醒 |
| notification | 一般通知 |
| celebration | 成就庆祝 |

### 7.2 情绪化通知模板

| 场景 | 标题 | 内容 |
|------|------|------|
| 新点餐 | 新的点餐请求 🍽️ | 老婆想吃【xxx】啦～快去看看吧！ |
| 开始制作 | 开始制作啦 👨‍🍳 | 【xxx】正在制作中，请稍等片刻～ |
| 完成制作 | 做好啦！快来尝尝 🎉 | 【xxx】已经完成啦，趁热吃～ |
| 温柔催单 | 温馨提醒 💕 | 老婆等【xxx】等好久了呢～ |
| 催促催单 | 催催催！🔥 | 再不做【xxx】老婆要生气啦！ |
| 拒绝订单 | 订单被拒绝了 😢 | 老公说【xxx】做不了，理由：xxx |

### 7.3 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| POST | /api/notifications | 发送通知 |
| PUT | /api/notifications/{id}/read | 标记已读 |
| PUT | /api/notifications/read-all | 全部已读 |
| DELETE | /api/notifications/{id} | 删除通知 |
| GET | /api/notifications/unread-count | 未读数量 |

---

## 八、消息系统

### 8.1 功能

- 家庭成员间即时消息
- 会话列表（显示未读数）
- 聊天详情页面
- 发送消息自动创建通知

### 8.2 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/messages | 发送消息 |
| GET | /api/messages?conversation_with={userId} | 获取对话 |
| GET | /api/messages/conversations | 会话列表 |
| PUT | /api/messages/{id}/read | 标记已读 |
| GET | /api/messages/unread-count | 未读数量 |

---

## 九、权限系统 (v5.0)

### 9.1 权限模型

角色 ≠ 权限，按能力粒度控制：

| 权限 | 说明 | wife | husband | admin |
|------|------|------|---------|-------|
| order:create | 下单 | ✓ | | |
| order:cancel | 取消订单 | ✓ | | |
| order:notify | 催单 | ✓ | | |
| order:accept | 接受订单 | | ✓ | |
| order:reject | 拒绝订单 | | ✓ | |
| order:complete | 完成订单 | | ✓ | |
| dish:create | 创建菜品 | ✓ | | |
| dish:update | 更新菜品 | ✓ | | |
| dish:delete | 删除菜品 | ✓ | | |
| dish:view | 查看菜品 | | ✓ | |
| category:manage | 管理分类 | ✓ | | |
| favorite:manage | 管理收藏 | ✓ | | |
| message:send | 发送消息 | | ✓ | |
| admin:all | 全部权限 | | | ✓ |

### 9.2 家庭成员表 (family_members)

| 字段 | 说明 |
|------|------|
| id | 主键 |
| family_id | 家庭ID |
| user_id | 用户ID |
| role | 角色 (wife/husband) |
| status | 状态 (pending/active/inactive) |
| joined_at | 加入时间 |

---

## 十、数据模型

### 10.1 ER 图

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   families   │     │ family_members    │     │    users     │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)      │←──┐ │ id (PK)           │ ┌──→│ id (PK)      │
│ invite_code  │   └─│ family_id (FK)    │ │   │ username     │
│ name         │     │ user_id (FK)      │─┘   │ password_hash│
└──────────────┘     │ role              │     └──────────────┘
                     │ status            │
                     └──────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   orders     │────→│   order_items    │←────│   dishes     │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)      │←──┐ │ id (PK)          │     │ id (PK)      │
│ family_id    │   └─│ order_id (FK)    │     │ family_id    │
│ user_id      │     │ dish_id (FK)     │←────│ category_id  │
│ status       │     │ status           │     │ name         │
│ created_at   │     │ notes            │     │ rating (1-5) │
└──────────────┘     └──────────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   favorites  │────→│   dishes     │     │  categories  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │←────│ id (PK)      │
│ user_id (FK) │     │ ...          │     │ family_id    │
│ dish_id (FK) │     └──────────────┘     │ name         │
└──────────────┘                        └──────────────┘

┌──────────────┐     ┌──────────────┐
│notifications │     │   messages  │
├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │
│ user_id      │     │ sender_id    │
│ sender_id    │     │ receiver_id  │
│ type         │     │ content      │
│ title        │     └──────────────┘
│ content      │
└──────────────┘
```

### 10.2 表结构

**families**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| invite_code | TEXT | 6位邀请码，唯一 |
| name | TEXT | 家庭名称 |
| created_at | TIMESTAMPTZ | 创建时间 |

**users**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | TEXT | 用户名，唯一 |
| password_hash | TEXT | 密码哈希 |
| status | VARCHAR(20) | active/inactive |
| created_at | TIMESTAMPTZ | 创建时间 |

**family_members**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| family_id | UUID | 家庭ID，外键 |
| user_id | UUID | 用户ID，外键 |
| role | VARCHAR(20) | wife/husband |
| status | VARCHAR(20) | pending/active/inactive |
| joined_at | TIMESTAMPTZ | 加入时间 |

**categories**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| family_id | UUID | 家庭ID，外键 |
| name | TEXT | 分类名称 |
| icon | TEXT | emoji图标 |
| sort_order | INT | 排序 |
| created_at | TIMESTAMPTZ | 创建时间 |

**dishes**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| family_id | UUID | 家庭ID，外键 |
| category_id | UUID | 分类ID，外键 |
| name | TEXT | 菜品名称 |
| tags | TEXT[] | 标签数组 |
| rating | INT | 评分 1-5 |
| image_url | TEXT | 图片URL |
| description | TEXT | 描述 |
| created_at | TIMESTAMPTZ | 创建时间 |

**favorites** (v5.0 改为 user_id 维度)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID，外键 |
| dish_id | UUID | 菜品ID，外键 |
| created_at | TIMESTAMPTZ | 创建时间 |
| 约束 | | UNIQUE(user_id, dish_id) |

**orders** (v5.0 新增)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| family_id | UUID | 家庭ID，外键 |
| user_id | UUID | 下单用户ID，外键 |
| status | VARCHAR(20) | pending/cooking/completed/cancelled/rejected |
| notes | TEXT | 整单备注 |
| created_at | TIMESTAMPTZ | 创建时间 |
| confirmed_at | TIMESTAMPTZ | 老公确认时间 |
| completed_at | TIMESTAMPTZ | 完成时间 |

**order_items** (v5.0 新增)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | UUID | 订单ID，外键 |
| dish_id | UUID | 菜品ID，外键 |
| status | VARCHAR(20) | pending/cooking/completed/cancelled |
| notes | TEXT | 单道菜备注 |
| cooked_at | TIMESTAMPTZ | 完成时间 |

**notifications**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 接收用户ID，外键 |
| sender_id | UUID | 发送用户ID，外键 |
| family_id | UUID | 家庭ID，外键 |
| type | VARCHAR(20) | notification/message/task/celebration |
| title | TEXT | 标题 |
| content | TEXT | 内容 |
| is_read | BOOLEAN | 已读标记 |
| created_at | TIMESTAMPTZ | 创建时间 |

**messages**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| sender_id | UUID | 发送用户ID，外键 |
| receiver_id | UUID | 接收用户ID，外键 |
| family_id | UUID | 家庭ID，外键 |
| content | TEXT | 消息内容 |
| is_read | BOOLEAN | 已读标记 |
| created_at | TIMESTAMPTZ | 创建时间 |

---

## 十一、API 接口

### 11.1 认证

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/register | 注册（不选角色） | 公开 |
| POST | /api/auth/login | 登录 | 公开 |
| POST | /api/auth/setup-role | 首次设置角色+家庭 | 已登录 |

### 11.2 家庭

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/families/{id} | 获取家庭信息 |
| POST | /api/families/join | 通过邀请码加入 |
| GET | /api/families/{id}/members | 家庭成员列表 |
| POST | /api/families/generate-code | 生成新邀请码 |

### 11.3 分类

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/{id} | 更新分类 |
| DELETE | /api/categories/{id} | 删除分类 |

### 11.4 菜品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dishes | 获取菜品列表 |
| POST | /api/dishes | 创建菜品 |
| PUT | /api/dishes/{id} | 更新菜品 |
| DELETE | /api/dishes/{id} | 删除菜品 |

### 11.5 收藏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/favorites | 获取收藏列表（user_id维度） |
| POST | /api/favorites/{dish_id} | 添加收藏 |
| DELETE | /api/favorites/{dish_id} | 取消收藏 |

### 11.6 订单

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/orders | 批量创建订单 | order:create |
| GET | /api/orders | 订单列表 | - |
| GET | /api/orders/today | 今日菜单 | - |
| GET | /api/orders/pending | 待处理订单 | husband |
| POST | /api/orders/{id}/accept | 接受订单 | order:accept |
| POST | /api/orders/{id}/reject | 拒绝订单 | order:reject |
| POST | /api/orders/{id}/complete | 完成订单 | order:complete |
| POST | /api/orders/{id}/cancel | 取消订单 | order:cancel |
| POST | /api/orders/{id}/notify | 催单提醒 | order:notify |

### 11.7 消息

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/messages | 发送消息 |
| GET | /api/messages?conversation_with={id} | 获取对话 |
| GET | /api/messages/conversations | 会话列表 |
| PUT | /api/messages/{id}/read | 标记已读 |
| GET | /api/messages/unread-count | 未读数量 |

### 11.8 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/notifications | 发送通知 |
| GET | /api/notifications | 通知列表 |
| PUT | /api/notifications/{id}/read | 标记已读 |
| PUT | /api/notifications/read-all | 全部已读 |
| DELETE | /api/notifications/{id} | 删除通知 |
| GET | /api/notifications/unread-count | 未读数量 |

### 11.9 推荐

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/recommendations | 智能推荐列表 |
| GET | /api/recommendations/random | 随机推荐 |
| GET | /api/recommendations/favorites | 相似推荐 |
| POST | /api/recommendations/feedback | 反馈 |

### 11.10 统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/dashboard | 仪表盘统计 |
| GET | /api/stats/weekly | 本周统计 |
| GET | /api/stats/monthly | 本月统计 |
| GET | /api/stats/top-dishes | 热门菜品 |
| GET | /api/stats/category-analysis | 分类分析 |

### 11.11 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/admin/dishes | 菜品 CRUD |
| GET/POST/PUT/DELETE | /api/admin/categories | 分类 CRUD |
| GET | /api/admin/favorites | 收藏列表 |
| GET | /api/admin/history | 历史记录 |

---

## 十二、UI 设计规范

### 12.1 老婆端主题

| 元素 | 颜色/值 |
|------|---------|
| 主色 | #F06565 珊瑚红 |
| 背景渐变 | #FFF5F5 → #F5F5F7 |
| 卡片背景 | #FFFFFF |
| 文字主色 | #333333 |
| 文字次色 | #666666 |
| 边框 | #F0F0F0 |
| 卡片圆角 | 16px |
| 按钮圆角 | 14px |

### 12.2 老公端主题

| 元素 | 颜色/值 |
|------|---------|
| 主色 | #3CBAB2 薄荷绿 |
| 背景渐变 | #F0FFFE → #F5F5F7 |
| NavBar 渐变 | #4ECDC4 → #6EE7DF |

### 12.3 管理端主题

| 元素 | 颜色/值 |
|------|---------|
| 主色 | #1677FF 蓝色系 |
| 背景 | #F5F7FA |
| 卡片 | #FFFFFF |
| 边框 | #E5E6EB |

### 12.4 动画

| 动画 | 说明 | 时长 |
|------|------|------|
| heartbeat | 心跳效果，用于推荐卡片 | 0.6s |
| float | 飘浮效果 | 2s infinite |
| fadeIn | 渐显 | 0.3s |
| slideUp | 滑入 | 0.3s |

### 12.5 布局规范

| 规范 | 值 |
|------|---|
| 页面边距 | 16px |
| 模块间距 | 12px |
| 卡片内边距 | 12px |
| TabBar 高度 | 50px + safe-area |
| NavBar 高度 | 45px |

---

## 十三、页面列表

### 老婆端 (/)

| 路径 | 页面 | 说明 |
|------|------|------|
| /login | 登录 | 用户名+密码登录 |
| /register | 注册 | 创建账号 |
| /home | 首页 | 今日推荐+功能入口 |
| /dishes | 点餐 | 菜品列表+分类筛选 |
| /dish-form | 菜品编辑 | 新增/编辑菜品 |
| /categories | 分类管理 | 分类 CRUD |
| /orders | 订单 | 订单列表+催单+取消 |
| /favorites | 收藏 | 收藏列表 |
| /history | 历史 | 点餐历史 |
| /messages | 消息 | 会话列表 |
| /chat/:userId | 聊天 | 与家庭成员聊天 |
| /profile | 我的 | 个人信息+邀请码 |

### 老公端 (/husband)

| 路径 | 页面 | 说明 |
|------|------|------|
| /husband | 任务首页 | 今日任务+快捷操作 |
| /husband/tasks | 任务列表 | 待处理/制作中任务 |
| /husband/history | 历史 | 已完成任务历史 |

### 管理端 (/admin)

| 路径 | 页面 | 说明 |
|------|------|------|
| /admin | 仪表盘 | 统计数据概览 |
| /admin/dishes | 菜品管理 | 菜品 CRUD |
| /admin/categories | 分类管理 | 分类 CRUD |
| /admin/favorites | 收藏管理 | 收藏列表 |
| /admin/history | 历史记录 | 点餐历史 |
| /admin/settings | 系统设置 | 配置 |

---

## 十四、测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 老婆 | wife003 | 123456 | 测试用户 |
| 老公 | husband003 | 123456 | 测试用户 |
| 管理员 | admin | admin123 | 系统管理 |

---

## 十五、版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-04-03 | 项目初始化，基础功能 |
| v2.0 | 2026-04-03 | 老公端、管理端、RBAC 权限 |
| v2.2 | 2026-04-03 | 消息系统 |
| v2.3 | 2026-04-03 | 消息系统前端 |
| v2.4 | 2026-04-03 | 智能推荐系统 |
| v2.5 | 2026-04-03 | 数据统计模块 |
| v2.6 | 2026-04-07 | Bug修复、UI优化 |
| v4.0 | 2026-04-08 | 布局优化、TabBar订单入口 |
| v5.0 | 2026-04-08 | 全面重构：用户系统解耦、权限系统、订单状态机、UI统一 |

---

*文档版本: v5.0*
*最后更新: 2026-04-08*
