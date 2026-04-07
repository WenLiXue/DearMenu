# DearMenu 点菜应用 - 项目进度报告

## 项目信息
- **项目名称**: DearMenu（亲爱的菜单）
- **创建日期**: 2026-04-03
- **项目路径**: D:\Projects\DearMenu
- **目标用户**: 老婆大人
- **使用场景**: 日常点餐选择

---

## 一、技术架构

### 1.1 技术栈
| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React 18 + Ant Design Mobile | 移动端优先UI框架 |
| 后端 | Python FastAPI | 轻量高性能API框架 |
| 数据库 | PostgreSQL 15 (Docker) | 容器化部署 |
| 认证 | JWT Token | 无状态认证 |
| 状态管理 | Zustand | 轻量状态管理 |
| 路由 | React Router v6 | SPA路由 |
| 构建工具 | Vite | 快速打包 |

### 1.2 项目结构
```
DearMenu/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── database.py          # 数据库连接
│   ├── models.py            # SQLAlchemy 模型
│   ├── schemas.py           # Pydantic 模型
│   ├── auth.py              # JWT 认证
│   ├── requirements.txt    # Python 依赖
│   └── routes/
│       ├── auth.py          # 认证路由
│       ├── categories.py    # 分类路由
│       ├── dishes.py        # 菜品路由
│       ├── favorites.py     # 收藏路由
│       ├── history.py       # 历史路由
│       ├── random.py        # 随机推荐路由
│       ├── notifications.py # 通知路由
│       └── messages.py      # 消息路由
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # 根组件
│   │   ├── main.tsx        # 入口文件
│   │   ├── api/            # API 调用封装
│   │   ├── components/
│   │   │   ├── Layout.tsx  # 页面布局
│   │   │   └── Layout.css
│   │   ├── contexts/       # React 上下文
│   │   │   └── DeviceContext.tsx
│   │   ├── hooks/          # 自定义 Hooks
│   │   │   └── useDevice.ts
│   │   ├── pages/         # 页面组件
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Home.tsx + Home.css
│   │   │   ├── Dishes.tsx + Dishes.css
│   │   │   ├── DishForm.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Favorites.tsx
│   │   │   ├── History.tsx
│   │   │   ├── RandomPick.tsx + RandomPick.css
│   │   │   └── Auth.css
│   │   ├── stores/         # Zustand 状态
│   │   │   ├── authStore.ts
│   │   │   ├── dishStore.ts
│   │   │   └── categoryStore.ts
│   │   └── types/          # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # Docker 配置
├── SPEC.md                  # 项目规格说明
├── PROGRESS.md              # 项目进度报告
└── .claude/docs/DearMenu-001/
    └── README.md            # 需求文档
```

### 1.3 数据库设计

#### 表结构
```sql
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)

categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
)

favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, dish_id)
)

order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## 二、功能模块

### 2.1 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户注册 | ✅ 完成 | 用户名+密码注册，自动创建6个预设分类 |
| 用户登录 | ✅ 完成 | JWT Token认证 |
| 预设分类 | ✅ 完成 | 零食🍪、饮料🥤、奶茶🧋、水果🍎、热菜🍳、熟食🍖 |
| 分类管理 | ✅ 完成 | 添加/编辑/删除分类 |
| 菜品管理 | ✅ 完成 | 名称、分类、标签、评分(1-5星) |
| 收藏功能 | ✅ 完成 | 一键收藏/取消，收藏列表 |
| 历史记录 | ✅ 完成 | 查看点餐历史，按时间排序 |
| 随机推荐 | ✅ 完成 | 随机选择菜品，可指定分类 |
| 设备检测 | ✅ 完成 | 识别mobile/tablet/desktop |

### 2.2 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 用户注册，返回JWT token |
| /api/auth/login | POST | 用户登录，返回JWT token |
| /api/categories | GET | 获取用户分类列表 |
| /api/categories | POST | 创建分类 |
| /api/categories/{id} | PUT | 更新分类 |
| /api/categories/{id} | DELETE | 删除分类 |
| /api/dishes | GET | 获取菜品列表（支持category_id筛选） |
| /api/dishes | POST | 创建菜品 |
| /api/dishes/{id} | PUT | 更新菜品 |
| /api/dishes/{id} | DELETE | 删除菜品 |
| /api/favorites | GET | 获取收藏列表 |
| /api/favorites/{dish_id} | POST | 添加收藏 |
| /api/favorites/{dish_id} | DELETE | 取消收藏 |
| /api/history | GET | 获取历史记录 |
| /api/history/{dish_id} | POST | 添加历史记录 |
| /api/random | GET | 随机推荐（支持category_id） |
| /api/notifications | POST | 发送通知 |
| /api/notifications | GET | 获取通知列表 |
| /api/notifications/{id}/read | PUT | 标记已读 |
| /api/notifications/read-all | PUT | 全部标记已读 |
| /api/notifications/{id} | DELETE | 删除通知 |
| /api/notifications/unread-count | GET | 获取未读数量 |
| /api/messages | POST | 发送消息 |
| /api/messages | GET | 获取与某用户的对话 |
| /api/messages/conversations | GET | 获取所有会话列表 |
| /api/messages/{id}/read | PUT | 标记消息已读 |
| /api/messages/unread-count | GET | 获取未读消息数量 |
| /api/health | GET | 健康检查 |

---

## 三、UI/UX 设计

### 3.1 设计理念
**目标**：从"程序员自用工具"升级为"老婆愿意每天打开的温馨小应用"

### 3.2 配色方案
| 用途 | 颜色 | 说明 |
|------|------|------|
| 主色 | #FF6B6B | 珊瑚红，用于按钮、强调 |
| 辅助色 | #4ECDC4 | 薄荷绿，用于次要操作 |
| 强调色 | #FFE66D | 金色，用于星级评分 |
| 背景色 | #F7F7F7 | 浅灰白，有呼吸感 |
| 文字色 | #333333 | 深灰，易读不刺眼 |

### 3.3 布局规范
| 规范 | 数值 | 说明 |
|------|------|------|
| 页面左右边距 | 16px | 统一左右留白 |
| 模块间距 | 12px | 模块之间保持一致 |
| 卡片内边距 | 12px | 卡片内容不贴边 |
| 卡片圆角 | 12-16px | 圆角设计 |
| 按钮圆角 | 14-18px | 圆润手感 |

### 3.4 交互效果
| 交互 | 效果 | 说明 |
|------|------|------|
| 卡片Hover | translateY(-2px) | 上浮反馈 |
| 卡片点击 | scale(0.98) | 点击缩放 |
| 按钮点击 | scale(0.95) | 按压反馈 |
| 页面切换 | fade | 平滑过渡 |
| 分类切换 | scroll | 平滑滚动 |

### 3.5 温馨文案
| 场景 | 文案 |
|------|------|
| 空状态 | "还没有菜品呢，添加一个吧~" |
| 加载中 | "马上就好啦~ 🔮" |
| 登录失败 | "哎呀，登录失败了，再试一次吧" |
| 收藏成功 | "收藏成功~" |
| 取消收藏 | "取消收藏啦" |
| 首页标题 | "今天吃什么呀？" |
| 问候语 | "早上好 ☀️" / "下午好 🌤️" / "晚上好 🌙" |

### 3.6 页面结构
| 页面 | 路径 | 标题 | 功能 |
|------|------|------|------|
| 登录 | /login | DearMenu | 用户登录 |
| 注册 | /register | 开启美食之旅 | 用户注册 |
| 首页 | /home | 今天吃什么呀？ | 入口导航、今日推荐 |
| 点菜 | /dishes | 你的小菜单 | 菜品列表、分类筛选 |
| 分类 | /categories | 分类管理 | 分类增删改 |
| 菜品表单 | /dish-form | 添加/编辑菜品 | 菜品CRUD |
| 收藏 | /favorites | 收藏 💕 | 收藏列表 |
| 历史 | /history | 历史记录 | 点餐历史 |
| 随机 | /random | 随机推荐 | 随机选菜 |

---

## 四、服务状态

### 4.1 当前运行地址
| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3007 | React开发服务器 |
| 后端API | http://localhost:8000 | FastAPI服务 |
| API文档 | http://localhost:8000/docs | Swagger文档 |

### 4.2 启动命令

**1. Docker数据库**
```bash
cd D:/Projects/DearMenu
docker-compose up -d
```

**2. 后端服务**
```bash
cd D:/Projects/DearMenu/backend
python main.py
```

**3. 前端服务**
```bash
cd D:/Projects/DearMenu/frontend
npm run dev
```

### 4.3 测试账号
| 账号 | 密码 | 说明 |
|------|------|------|
| wife003 | 123456 | 测试用户 |

---

## 五、问题记录

### 5.1 已解决问题
| 问题 | 解决方案 |
|------|----------|
| UI库选型错误 | Vant是Vue版本，改用Ant Design Mobile |
| CORS跨域 | FastAPI配置CORSMiddleware |
| 数据库连接 | Docker容器化PostgreSQL |
| 注册API参数 | 移除多余的email参数 |
| 分类标签文字不可见 | 未选中状态改为#E8E8E8背景+#333文字 |
| TabBar文字颜色淡 | 未选中#666，选中#FF6B6B |

### 5.2 注意事项
1. Docker Desktop需要手动启动
2. 后端需要先于前端启动
3. 数据库端口5432需要未被占用

---

## 六、待优化项

### 6.1 功能增强
- [x] 菜品搜索功能（管理员后台支持）
- [x] 菜品图片上传（后台支持 image_url）
- [ ] 微信登录支持
- [ ] 数据导出/备份
- [ ] 微信消息通知老婆（老公端完成后）

### 6.2 UI优化
- [ ] 暗色模式支持
- [ ] 加载状态骨架屏
- [ ] 空状态插画

### 6.3 性能优化
- [ ] 图片懒加载
- [ ] API响应缓存
- [ ] 首屏加载优化

### 6.4 部署准备
- [ ] 选择云服务器
- [ ] 配置生产环境Nginx
- [ ] 域名绑定
- [ ] HTTPS证书

---

## 七、版本记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-04-03 | v1.0 | 项目初始化，完成基础功能 |
| 2026-04-03 | v1.1 | UI风格升级（微信小程序风格） |
| 2026-04-03 | v1.2 | 布局优化（首屏完整显示） |
| 2026-04-03 | v1.3 | 温馨化优化（文案+emoji） |
| 2026-04-03 | v1.4 | 分类标签颜色修复 |
| 2026-04-03 | v2.0 | 老公端页面、管理员后台 |
| 2026-04-03 | v2.1 | RBAC权限体系、家庭隔离 |
| 2026-04-03 | v2.2 | 消息系统后端API |
| 2026-04-03 | v2.3 | 消息系统前端页面 |
| 2026-04-03 | v2.4 | 智能推荐系统后端 |

## v2.0 开发（2026-04-03）

### 新增功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 老公端移动端页面 | ✅ 完成 | 今日任务、状态流转、快捷操作、反馈互动 |
| 老公端后端API | ✅ 完成 | /api/husband/* 所有接口 |
| 管理员后台页面 | ✅ 完成 | 仪表盘、菜品管理、分类管理等 |
| 管理员后台API | ✅ 完成 | /api/admin/* 所有接口 |

## v2.1 RBAC权限体系（2026-04-03）

### 核心变更

| 变更 | 说明 |
|------|------|
| 角色选择 | 注册时选择 wife/husband 角色 |
| 家庭隔离 | family_id 数据域隔离 |
| 邀请码 | 6位邀请码加入家庭 |
| 路由守卫 | AuthGuard 前端权限控制 |
| 接口鉴权 | 后端角色中间件校验 |

### 新增数据库表

| 表名 | 说明 |
|------|------|
| families | 家庭表（id, invite_code, name） |
| role 字段 | users 表新增角色字段 |
| family_id 字段 | 所有数据表新增家庭隔离字段 |

### API 变更

| 接口 | 变更 |
|------|------|
| POST /api/auth/register | 支持 role + family 创建/加入 |
| POST /api/auth/login | 返回 token + role + family_id |
| GET /api/families/* | 家庭相关API |
| 老公端API | 添加 require_role('husband') 校验 |

### 前端变更

| 文件 | 变更 |
|------|------|
| AuthGuard.tsx | 新建路由守卫组件 |
| Register.tsx | 三步骤注册（用户密码→角色→家庭） |
| Login.tsx | 登录后按 role 跳转 |
| App.tsx | 路由守卫保护 |
| Home.tsx | 邀请码展示 |

### 新增页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 老公端首页 | /husband | 今日任务展示与操作 |
| 老公端历史 | /husband/history | 已完成任务历史 |
| 管理仪表盘 | /admin | 统计数据概览 |
| 菜品管理 | /admin/dishes | 菜品CRUD |
| 分类管理 | /admin/categories | 分类CRUD |
| 收藏管理 | /admin/favorites | 收藏查看与推荐 |
| 历史管理 | /admin/history | 点餐历史 |
| 系统设置 | /admin/settings | 系统配置 |

### 技术变更

- `OrderHistory` 模型新增 `status`、`cooked_at` 字段
- `Dish` 模型新增 `image_url`、`description` 字段
- 新增 `/api/husband/*` 路由
- 新增 `/api/admin/*` 路由
- 新增 `require_family` 依赖，确保用户已加入家庭
- 通知系统 API 使用 `require_family` 依赖进行家庭过滤

### 团队贡献

| Agent | 贡献 |
|-------|------|
| husband-backend | 老公端后端API |
| admin-backend | 管理员后台API |
| husband-frontend | 老公端移动端页面 |
| admin-frontend | 管理员后台页面 |

## v2.2 消息系统（2026-04-03）

### 新增功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 消息发送 | ✅ 完成 | 家庭成员间发送消息 |
| 对话历史 | ✅ 完成 | 获取与某用户的对话历史 |
| 会话列表 | ✅ 完成 | 获取所有会话列表及未读数 |
| 标记已读 | ✅ 完成 | 标记消息为已读 |
| 未读计数 | ✅ 完成 | 获取未读消息数量 |
| 自动通知 | ✅ 完成 | 发送消息后自动创建 Notification |

### 技术实现

- 新增 `routes/messages.py` 消息路由模块
- `Message` 模型已在 `models.py` 中定义
- `MessageCreate`, `MessageResponse`, `MessageConversationResponse` schemas 已在 `schemas.py` 中定义
- 消息发送后自动创建 type="message" 的 Notification

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/messages | POST | 发送消息 |
| /api/messages | GET | 获取与某用户的对话（?conversation_with={user_id}） |
| /api/messages/conversations | GET | 获取所有会话列表 |
| /api/messages/{id}/read | PUT | 标记消息已读 |
| /api/messages/unread-count | GET | 获取未读消息数量 |

## v2.3 消息系统前端（2026-04-03）

### 新增前端文件

| 文件 | 说明 |
|------|------|
| types/index.ts | 添加 Message 和 Conversation 接口 |
| api/messages.ts | 消息 API 调用封装 |
| stores/messageStore.ts | 消息 Zustand 状态管理 |
| pages/Messages.tsx | 会话列表页面 |
| pages/Chat.tsx | 聊天详情页面 |
| pages/Chat.css | 聊天页面样式 |

### 页面功能

- **Messages.tsx**：展示所有会话列表，显示对方用户名、角色、最后一条消息内容和时间、未读数量
- **Chat.tsx**：聊天详情页面，支持发送消息、显示消息时间、按日期分组

### 路由配置

| 路由 | 页面 | 说明 |
|------|------|------|
| /messages | Messages | 会话列表 |
| /chat/:userId | Chat | 与指定用户的聊天详情 |

## v2.4 智能推荐系统（2026-04-03）

### 新增功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 智能推荐算法 | ✅ 完成 | 多因素加权推荐（频率、评分、多样性、时间、随机） |
| 收藏相似推荐 | ✅ 完成 | 基于标签和分类的相似度推荐 |
| 推荐反馈机制 | ✅ 完成 | 喜欢/不喜欢反馈 |
| 推荐结果缓存 | ✅ 完成 | 10分钟缓存提升性能 |
| 家庭历史综合 | ✅ 完成 | 考虑家庭成员点餐历史 |

### 推荐算法设计

#### 权重因素

| 因素 | 权重系数 | 说明 |
|------|----------|------|
| 频率权重 | 2.0 | 最近点过的菜更可能再次想吃，基于时间衰减 |
| 评分权重 | 1.5 | 评分高的菜优先推荐 |
| 分类多样性 | 1.0 | 同一分类最多3道菜，避免重复 |
| 时间因素 | 1.2 | 早餐/午餐/晚餐/夜宵不同时段推荐不同类型 |
| 反馈权重 | 2.0 | 用户喜欢/不喜欢反馈调整 |
| 随机性 | 0.3 | 增加趣味性，避免推荐固化 |

#### 时段推荐分类

| 时段 | 推荐关键词 |
|------|-----------|
| 早餐 (5-10) | 粥、包子、馒头、饼、鸡蛋、面包、牛奶、豆浆 |
| 午餐 (10-14) | 主食、米饭、面、炒菜、快餐 |
| 下午茶 (14-17) | 奶茶、咖啡、水果、零食、甜点、蛋糕 |
| 晚餐 (17-21) | 热菜、家常菜、炒菜、炖菜、汤 |
| 夜宵 (21-5) | 夜宵、烧烤、小吃、零食、水果 |

### 新增数据库表

| 表名 | 说明 |
|------|------|
| recommendation_feedback | 推荐反馈表（user_id, dish_id, feedback, created_at） |

### 新增 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/recommendations | GET | 获取智能推荐列表 |
| /api/recommendations/random | GET | 获取随机推荐 |
| /api/recommendations/favorites | GET | 推荐类似的收藏菜品 |
| /api/recommendations/feedback | POST | 提交喜欢/不喜欢反馈 |
| /api/recommendations/stats | GET | 获取推荐统计数据 |

### 新增文件

| 文件 | 说明 |
|------|------|
| routes/recommendations.py | 推荐路由模块 |
| schemas.py 新增 | 推荐相关的 Pydantic schemas |
| models.py 更新 | 添加 RecommendationFeedback 模型 |

## v2.5 数据统计模块（2026-04-03）

### 新增功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 仪表盘统计 | ✅ 完成 | 今日点餐/完成/推荐、本周概览 |
| 本周趋势 | ✅ 完成 | 每日明细表格、完成率统计 |
| 本月统计 | ✅ 完成 | 热门分类 Top5、热门菜品 Top5 |
| 热门菜品 | ✅ 完成 | 可配置 Top N 的热门菜品排行 |
| 分类分析 | ✅ 完成 | 各分类的菜品数、点餐数、收藏数 |
| 趋势图表 | ✅ 完成 | 本周点餐趋势柱状图展示 |

### 新增 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/stats/dashboard | GET | 仪表盘统计数据 |
| /api/stats/weekly | GET | 本周详细统计 |
| /api/stats/monthly | GET | 本月统计 |
| /api/stats/top-dishes | GET | 热门菜品 Top N |
| /api/stats/category-analysis | GET | 分类分析统计 |

### 新增/修改文件

| 文件 | 变更 |
|------|------|
| backend/routes/stats.py | 新增 - 统计路由模块 |
| backend/schemas.py | 修改 - 添加统计数据相关的 Pydantic schemas |
| backend/main.py | 修改 - 注册 stats 路由 |
| frontend/src/api/admin.ts | 修改 - 添加统计 API 调用 |
| frontend/src/stores/adminStore.ts | 修改 - 添加统计状态管理 |
| frontend/src/pages/admin/Dashboard.tsx | 修改 - 增强统计页面展示 |

### 统计数据说明

- 所有统计数据均基于 `family_id` 过滤，确保家庭数据隔离
- 仪表盘展示今日、本周汇总数据
- Tab 切换展示今日/本周/本月详细统计
- 热门菜品按点餐次数排序
- 分类分析展示各分类的菜品数、点餐次数、收藏数

## v2.6 Bug修复与UI优化（2026-04-07）

### 修复内容

| 问题 | 修复文件 | 说明 |
|------|----------|------|
| Tag组件size属性错误 | 多个页面 | Ant Design Mobile Tag不支持size属性，已移除 |
| 收藏状态判断错误 | Dishes.tsx | isFavorited函数比较f.dish_id但API返回的是菜品对象 |
| 收藏按钮样式不生效 | Dishes.tsx, Dishes.css | 添加.action-btn-favorited样式类 |
| 收藏页面显示undefined | Favorites.tsx | API返回菜品对象而非{dish:{...}}结构 |
| Messages页面无返回按钮 | Messages.tsx | NavBar添加back和onBack属性 |
| Notifications页面无返回按钮 | Notifications.tsx | NavBar添加back和onBack属性 |
| TabBar双重emoji | Layout.tsx | 移除getTabTitle中的额外emoji |

### 新增文件

| 文件 | 说明 |
|------|------|
| frontend/src/theme.css | CSS变量和公共样式类 |

### 样式统一

- 创建theme.css统一管理CSS变量
- 主色调：#FF6B6B 珊瑚红
- 圆角：12px卡片、8px按钮、4px标签
- 阴影：统一--shadow-sm、--shadow-md、--shadow-primary
- Ant Design Mobile组件样式修复

---

## 八、团队成员

| 角色 | Agent | 职责 |
|------|-------|------|
| 项目负责人 | team-lead | 需求分析、任务分配、进度跟踪 |
| 后端开发 | backend-dev | FastAPI API开发、数据库设计 |
| 前端开发 | frontend-dev / frontend-dev-2 | React组件开发、API对接 |
| UI设计 | ui-designer | 界面样式优化、温馨化设计 |

---

*文档更新时间: 2026-04-07*
*当前版本: v2.6*

## ⚠️ 数据库迁移说明

v2.1 需要执行数据库迁移：

1. 创建 families 表
2. users 表添加 role 和 family_id 字段
3. categories, dishes, favorites, order_history 表添加 family_id 字段
4. 现有数据需要填充 family_id（建议先创建或加入一个家庭）
