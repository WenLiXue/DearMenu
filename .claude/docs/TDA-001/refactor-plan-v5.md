# DearMenu v5.0 产品级重构方案

> 定位：情侣点餐协作系统 → 作品级项目（可面试讲解）
> 日期：2026-04-08

---

## 一、当前系统问题诊断

### 1.1 架构层面

| # | 问题 | 影响 | 严重度 |
|---|------|------|--------|
| A1 | 注册时绑定角色，不可修改 | 产品逻辑不合理 | 高 |
| A2 | 角色 = 权限（硬编码） | 不可扩展，新增角色需改代码 | 高 |
| A3 | Favorite 以 family_id 为维度 | 个人收藏变家庭收藏，逻辑错误 | 高 |
| A4 | 老公端无共享 Layout | 三个页面各自处理 NavBar/背景，大量重复 | 中 |
| A5 | 前端 User.id 始终为空字符串 | 任何需要用户 ID 的功能都不可靠 | 高 |
| A6 | Token 双重存储 | localStorage + Zustand persist，可能不同步 | 中 |
| A7 | husband API 独立 axios 实例 | 绕过统一响应拦截器，错误处理不一致 | 中 |

### 1.2 业务层面

| # | 问题 | 影响 | 严重度 |
|---|------|------|--------|
| B1 | 订单缺少 CANCELLED / REJECTED 状态 | 无法取消/拒绝订单 | 高 |
| B2 | 只能单道下单 | 实际使用需要批量点餐 | 高 |
| B3 | 没有"今日菜单"概念 | 缺少决策闭环 | 中 |
| B4 | 收藏按 family_id 隔离 | 老公收藏的菜也会出现在老婆收藏列表 | 中 |
| B5 | 通知文案固定 | 缺乏情侣产品的情绪温度 | 低 |

### 1.3 UI/UX 层面

| # | 问题 | 影响 | 严重度 |
|---|------|------|--------|
| C1 | 三套滚动策略冲突 | 布局不可预测，部分页面双滚动条 | 高 |
| C2 | 60px 底部 padding 冗余 | flex 布局已为 TabBar 留空间，又加了 padding | 中 |
| C3 | NavBar 颜色硬编码 | 绕过 theme.css 主题系统 | 中 |
| C4 | CSS 类重复定义 | `.page-container` 在 3 个文件中定义，加载顺序依赖 | 中 |
| C5 | 动画 keyframe 重复定义 | heartbeat、float、fadeIn 均有重复 | 低 |
| C6 | `getRecommendReason()` 每次渲染随机 | 重新渲染时推荐理由会变 | 低 |

---

## 二、重构目标

### 2.1 产品目标
- 老婆端：情绪化决策体验（粉色系、动画、温柔文案）
- 老公端：简洁执行体验（绿色系、任务导向、进度可视化）
- 管理端：数据驱动管理后台

### 2.2 技术目标
- 统一布局架构（一套 Layout 规则适配全部页面）
- 权限解耦（RBAC → Permission-based）
- 类型安全（前后端类型完全对齐）
- 单一 API 实例（统一拦截、错误处理）

---

## 三、系统架构设计

### 3.1 模块划分

```
DearMenu v5.0
│
├── backend/
│   ├── core/                    # 核心配置
│   │   ├── config.py            # 环境变量 + 常量
│   │   ├── security.py          # JWT + 密码 + 权限
│   │   └── database.py          # 数据库连接
│   │
│   ├── models/                  # 数据模型（按模块拆分）
│   │   ├── user.py              # User + FamilyMember
│   │   ├── family.py            # Family
│   │   ├── dish.py              # Category + Dish + Favorite
│   │   ├── order.py             # Order + OrderItem
│   │   ├── message.py           # Message + Notification
│   │   └── base.py              # 公共 Base 类
│   │
│   ├── schemas/                 # Pydantic 模型（按模块拆分）
│   │   ├── auth.py
│   │   ├── dish.py
│   │   ├── order.py
│   │   └── message.py
│   │
│   ├── routes/                  # API 路由
│   │   ├── auth.py
│   │   ├── families.py
│   │   ├── categories.py
│   │   ├── dishes.py
│   │   ├── favorites.py
│   │   ├── orders.py
│   │   ├── messages.py
│   │   ├── notifications.py
│   │   └── admin.py
│   │
│   ├── services/                # 业务逻辑层（新增）
│   │   ├── order_service.py     # 订单状态机 + 通知联动
│   │   ├── notification_service.py  # 通知模板 + 发送
│   │   └── recommendation_service.py  # 推荐算法
│   │
│   └── middleware/              # 中间件
│       └── permissions.py       # 权限校验中间件
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts        # 统一 axios 实例 + 拦截器
│   │   │   ├── auth.ts
│   │   │   ├── dishes.ts
│   │   │   ├── orders.ts
│   │   │   └── ...
│   │   │
│   │   ├── layouts/             # 布局组件（统一管理）
│   │   │   ├── WifeLayout.tsx    # 老婆端布局 + TabBar
│   │   │   ├── HusbandLayout.tsx # 老公端布局 + 底部导航
│   │   │   └── AdminLayout.tsx   # 管理端布局
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── orderStore.ts
│   │   │   └── ...
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePermissions.ts # 权限检查 hook
│   │   │   └── useDevice.ts
│   │   │
│   │   └── theme/
│   │       ├── wife.css          # 老婆端主题
│   │       ├── husband.css       # 老公端主题
│   │       └── common.css        # 公共样式
```

### 3.2 前端路由重构

```tsx
// App.tsx - 简化路由结构
<Routes>
  {/* 公开 */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/role-select" element={<RoleSelect />} />  {/* 新增：角色选择 */}

  {/* 老婆端 - 共享 WifeLayout */}
  <Route element={<AuthGuard role="wife" />}>
    <Route element={<WifeLayout />}>
      <Route path="/home" element={<Home />} />
      <Route path="/dishes" element={<Dishes />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/profile" element={<Profile />} />
      {/* 二级页面（无 TabBar） */}
      <Route path="/categories" element={<Categories />} />
      <Route path="/dish-form/:id?" element={<DishForm />} />
      <Route path="/history" element={<History />} />
    </Route>
  </Route>

  {/* 老公端 - 共享 HusbandLayout */}
  <Route element={<AuthGuard role="husband" />}>
    <Route element={<HusbandLayout />}>
      <Route path="/husband" element={<HusbandHome />} />
      <Route path="/husband/tasks" element={<HusbandTasks />} />
      <Route path="/husband/history" element={<HusbandHistory />} />
    </Route>
  </Route>

  {/* 管理端 */}
  <Route path="/admin" element={<AuthGuard role="admin" />}>
    <Route element={<AdminLayout />}>
      ...
    </Route>
  </Route>
</Routes>
```

---

## 四、数据库结构优化

### 4.1 核心变更

#### (1) 新增 `family_members` 表（解耦角色）

```sql
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'wife',        -- wife / husband
    status VARCHAR(20) NOT NULL DEFAULT 'active',     -- pending / active / inactive
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(family_id, user_id)
);
```

**为什么**：当前角色绑死在 User 表上，改角色要改 User 记录。用关联表实现：
- 一个用户可以属于多个家庭（未来扩展）
- 角色可以修改
- 加入家庭需要审批（pending → active）

#### (2) 新增 `orders` + `order_items` 表（支持批量点餐）

```sql
-- 订单主表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 下单人
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,                        -- 整单备注
    created_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,          -- 老公确认时间
    completed_at TIMESTAMPTZ           -- 完成时间
);

-- 订单项（一个订单包含多道菜）
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 独立状态
    notes TEXT,                        -- 单道菜备注
    cooked_at TIMESTAMPTZ
);
```

**为什么**：当前 `order_history` 表每道菜一条记录，无法表达"这次点了3道菜"的关系。拆为主表+明细：
- 支持批量下单
- 每道菜可独立追踪状态
- 整单有统一备注

#### (3) 修改 `favorites` 表（改为个人维度）

```sql
-- 移除 family_id 唯一约束，改为 user_id + dish_id 唯一
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS ...;
-- 收藏是个人行为，不是家庭行为
UNIQUE(user_id, dish_id)
```

#### (4) User 表变更

```sql
-- 移除 role 字段（角色迁移到 family_members）
-- 移除 family_id 字段（家庭关系迁移到 family_members）
-- 新增 status 字段
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- status: active / inactive
```

### 4.2 完整 ER 图

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   families   │     │ family_members   │     │    users     │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)      │←──┐ │ id (PK)          │ ┌──→│ id (PK)      │
│ invite_code  │   └─│ family_id (FK)   │ │   │ username     │
│ name         │     │ user_id (FK)     │─┘   │ password_hash│
│ created_at   │     │ role             │     │ status       │
└──────────────┘     │ status           │     │ created_at   │
                     └──────────────────┘     └──────┬───────┘
                                                       │
                     ┌──────────────────┐               │
                     │   categories     │               │
                     ├──────────────────┤               │
                     │ id (PK)          │               │
                     │ family_id (FK)   │               │
                     │ name             │               │
                     │ icon             │               │
                     │ sort_order       │               │
                     └────────┬─────────┘               │
                              │                         │
                     ┌────────▼─────────┐     ┌────────▼───────┐
                     │     dishes       │     │   favorites    │
                     ├──────────────────┤     ├────────────────┤
                     │ id (PK)          │     │ id (PK)        │
                     │ family_id (FK)   │     │ user_id (FK)   │← 个人维度
                     │ category_id (FK) │←──┐ │ dish_id (FK)   │
                     │ name             │   │ └────────────────┘
                     │ tags             │   │
                     │ rating           │   │ ┌────────────────┐
                     └────────┬─────────┘   │ │   orders       │
                              │             │ ├────────────────┤
                     ┌────────▼─────────┐   │ │ id (PK)        │
                     │   order_items    │   │ │ family_id (FK) │
                     ├──────────────────┤   │ │ user_id (FK)   │
                     │ id (PK)          │   │ │ status         │
                     │ order_id (FK)    │───┘ │ notes          │
                     │ dish_id (FK)     │←────┘ │ created_at     │
                     │ status           │     │ confirmed_at   │
                     │ notes            │     │ completed_at   │
                     │ cooked_at        │     └────────────────┘
                     └──────────────────┘
```

---

## 五、订单系统重构（核心）

### 5.1 状态机设计

```
                          ┌──────────┐
                 老婆取消  │CANCELLED │
              ┌──────────→│  已取消   │
              │           └──────────┘
              │
┌─────────┐   │   ┌─────────┐   │   ┌───────────┐
│ PENDING │───┤   │ COOKING │───┤   │ COMPLETED │
│ 待处理  │   │   │ 制作中  │   │   │  已完成   │
└─────────┘   │   └─────────┘   │   └───────────┘
              │           │     │
              │           │     │   ┌───────────┐
              │           └─────┴──→│ REJECTED  │
              │                    │  已拒绝   │
              │ 老公拒绝           └───────────┘
              │ (从 PENDING/COOKING)
              │
              └─── 老公接受 ──→ COOKING
```

### 5.2 状态流转规则

| 当前状态 | 操作 | 新状态 | 操作者 | 条件 |
|---------|------|--------|--------|------|
| PENDING | 接受订单 | COOKING | husband | 无 |
| PENDING | 拒绝订单 | REJECTED | husband | 必须填拒绝理由 |
| PENDING | 取消订单 | CANCELLED | wife | 只有下单人可取消 |
| COOKING | 完成制作 | COMPLETED | husband | 设置 completed_at |
| COOKING | 拒绝制作 | REJECTED | husband | 必须填理由 |
| COMPLETED | - | - | - | 终态，不可变更 |
| CANCELLED | - | - | - | 终态，不可变更 |
| REJECTED | - | - | - | 终态，不可变更 |

### 5.3 OrderItem 独立状态

```
order_items.status:
  PENDING → COOKING → COMPLETED  (每道菜独立追踪)
  PENDING → CANCELLED (老婆取消单道菜)
```

### 5.4 批量下单流程

```
【老婆端】                        【老公端】
    │                                │
    │ 1. 选择多道菜品                │
    │ 2. 确认下单                    │
    │ 3. POST /api/orders            │
    │    { items: [{dish_id, notes}] │
    │    }                           │
    │ ─────────────────────────────→ │ 收到通知: 新订单
    │                                │
    │                         4. 查看订单详情
    │                         5. 开始制作(逐道/全部)
    │ ←───────────────────────────── │ 通知: 开始制作了
    │                                │
    │                         6. 完成制作
    │ ←───────────────────────────── │ 通知: 菜做好了
    │                                │
    │ 7. 用餐                        │
```

---

## 六、用户系统重构

### 6.1 用户状态流转

```
┌──────────┐   注册   ┌──────────┐  选择角色  ┌──────────┐
│  未注册  │───────→│ 已注册   │──────────→│ 已选角色 │
└──────────┘         └──────────┘          └──────────┘
                                                │
                                     创建/加入家庭 │
                                                ▼
                                          ┌──────────┐
                                          │ 就绪     │
                                          │ (可正常用)│
                                          └──────────┘
```

### 6.2 注册流程重构

**之前**：注册 → 选角色 → 创建/加入家庭 → 全在一个接口

**之后**：分步完成

```
Step 1: POST /api/auth/register
        { username, password }
        → 返回 token（此时无角色、无家庭）

Step 2: GET /api/auth/role-select  (首次登录)
        → 显示角色选择页面

Step 3: POST /api/auth/setup-role
        { role, family_name? / invite_code? }
        → 创建/加入家庭，设置角色
```

### 6.3 登录后跳转逻辑

```typescript
// authStore 新增 setupCompleted 字段
function getLoginRedirectPath(user: AuthUser): string {
  if (!user.role) return '/role-select';        // 未选角色
  if (!user.familyId) return '/family-setup';    // 未加入家庭
  if (user.role === 'wife') return '/home';
  if (user.role === 'husband') return '/husband';
  if (user.role === 'admin') return '/admin';
  return '/home';
}
```

---

## 七、权限系统设计

### 7.1 权限模型

```python
# permissions.py
PERMISSIONS = {
    "wife": [
        "order:create",       # 下单
        "order:cancel",       # 取消自己的订单
        "order:notify",       # 催单
        "dish:create",        # 创建菜品
        "dish:update",        # 更新菜品
        "dish:delete",        # 删除菜品
        "category:manage",    # 管理分类
        "favorite:manage",    # 管理收藏
    ],
    "husband": [
        "order:accept",       # 接受订单
        "order:reject",       # 拒绝订单
        "order:complete",     # 完成制作
        "dish:view",          # 查看菜品
        "message:send",       # 发消息
    ],
    "admin": [
        "admin:all",          # 全部权限
    ],
}

def require_permission(permission: str):
    """权限校验装饰器"""
    def dependency(current_user: User = Depends(get_current_user)):
        user_permissions = PERMISSIONS.get(current_user.role, [])
        if "admin:all" in user_permissions:
            return current_user
        if permission not in user_permissions:
            raise HTTPException(403, "权限不足")
        return current_user
    return dependency
```

### 7.2 使用方式

```python
# 之前：按角色硬编码
@router.post("")
def create_order(current_user: User = Depends(require_role("wife"))):

# 之后：按权限校验
@router.post("")
def create_order(current_user: User = Depends(require_permission("order:create"))):
```

### 7.3 前端权限检查

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { role } = useAuthStore();

  const PERMISSIONS: Record<string, string[]> = {
    wife: ['order:create', 'order:cancel', 'order:notify', ...],
    husband: ['order:accept', 'order:reject', 'order:complete', ...],
    admin: ['admin:all'],
  };

  const has = (perm: string) => {
    const perms = PERMISSIONS[role ?? ''] ?? [];
    return perms.includes('admin:all') || perms.includes(perm);
  };

  return { has, can: has };
}

// 使用
const { can } = usePermissions();
{can('order:create') && <Button>下单</Button>}
```

---

## 八、收藏系统修复

### 8.1 变更点

| 维度 | 之前 | 之后 |
|------|------|------|
| 唯一约束 | (family_id, dish_id) | (user_id, dish_id) |
| 查询维度 | family_id | user_id |
| 含义 | 这个家庭收藏了 | 我收藏了 |

### 8.2 接口变更

```
GET  /api/favorites          → 查询当前用户的收藏列表
POST /api/favorites/{dish_id} → 当前用户添加收藏
DELETE /api/favorites/{dish_id} → 当前用户取消收藏
```

后端自动使用 `current_user.id`，无需额外传参。

---

## 九、推荐算法

### 9.1 权重公式

```
score = (
    rating_weight * (dish.rating / 5)           // 评分越高越好
    + favorite_weight * is_favorite              // 收藏的菜加权
    + recency_weight * days_since_last_order     // 越久没吃越推荐
    + diversity_weight * category_diversity      // 分类多样性
    + random_weight * random()                   // 随机性
)
```

### 9.2 参数

| 因素 | 权重 | 说明 |
|------|------|------|
| 评分 | 1.5 | 1-5 星归一化 |
| 收藏 | 2.0 | 收藏的菜 +2.0 分 |
| 最近未吃 | 1.8 | 超过 7 天未吃的菜加分 |
| 分类多样性 | 1.0 | 同分类最多推荐 3 道 |
| 随机 | 0.5 | 避免推荐固化 |

---

## 十、通知系统情绪化

### 10.1 通知模板

```python
NOTIFICATION_TEMPLATES = {
    "new_order": {
        "title": "新的点餐请求 🍽️",
        "content": "老婆想吃{dishes}啦～快去看看吧！",
        "tone": "温柔"
    },
    "cooking_start": {
        "title": "开始制作啦 👨‍🍳",
        "content": "【{dish}】正在制作中，请稍等片刻～",
        "tone": "温柔"
    },
    "order_complete": {
        "title": "做好啦！快来尝尝 🎉",
        "content": "【{dish}】已经完成啦，趁热吃～",
        "tone": "开心"
    },
    "remind_gentle": {
        "title": "温馨提醒 💕",
        "content": "老婆等【{dish}】等好久了呢～",
        "tone": "温柔"
    },
    "remind_urgent": {
        "title": "催催催！🔥",
        "content": "再不做【{dish}】老婆要生气啦！",
        "tone": "催促"
    },
    "order_rejected": {
        "title": "订单被拒绝了 😢",
        "content": "老公说【{dish}】做不了，理由：{reason}",
        "tone": "抱歉"
    },
    "all_complete": {
        "title": "全部完成啦！🎊",
        "content": "今天的{count}道菜全部做好啦，快来享用吧～",
        "tone": "庆祝"
    }
}
```

### 10.2 催单语气升级

```python
# 第 1 次催单 → 温柔
# 第 2 次催单 → 可爱
# 第 3 次+催单 → 生气
def get_remind_tone(remind_count: int) -> str:
    if remind_count == 0: return "温柔"
    if remind_count == 1: return "可爱"
    return "生气"
```

---

## 十一、前端 UI 重构

### 11.1 统一布局架构

**核心原则**：Layout 管滚动，Page 只管内容

```css
/* 唯一的滚动容器定义 */
.wife-layout, .husband-layout {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* TabBar 固定底部 */
.layout-tabbar {
  flex-shrink: 0;
  height: 50px + env(safe-area-inset-bottom);
}

/* 页面不再定义 height/overflow */
.page-content {
  padding: 12px 16px;
  /* 不设 height、不设 overflow、不设 padding-bottom 补偿 */
}
```

### 11.2 老婆端首页布局（首屏不可滚动）

```
┌─────────────────────────────┐
│ NavBar: 今天吃什么？          │  ← 固定，不参与滚动
├─────────────────────────────┤
│                             │
│  早上好 ☀️ 亲爱的            │  ← 问候 + 身份
│                             │
│ ┌─────────────────────────┐ │
│ │    今日推荐（核心视觉）   │ │  ← 大卡片，1道菜
│ │    🍳 番茄炒蛋            │ │     占首页 40% 高度
│ │    ★★★★☆ 上次: 3天前     │ │
│ │    [点这个] [换一个]      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │  ← 功能入口 4宫格
│ │点餐│ │分类│ │收藏│ │随机│   │     固定高度
│ └───┘ └───┘ └───┘ └───┘   │
│                             │
├─────────────────────────────┤
│ 🏠首页  🍽️点餐  📋订单  ❤️收藏  👤我的 │  ← TabBar 固定
└─────────────────────────────┘
```

**关键尺寸计算**：
```
100dvh = NavBar(45px) + 问候区(40px) + 推荐卡片(40%) + 四宫格(80px) + TabBar(50px)
       = 45 + 40 + auto(flex:1) + 80 + 50
```
推荐卡片使用 `flex: 1` 自动填充剩余空间。

### 11.3 老婆端 vs 老公端 UI 差异

| 维度 | 老婆端 | 老公端 |
|------|--------|--------|
| 主色 | #F06565 珊瑚红 | #3CBAB2 薄荷绿 |
| 背景 | #FFF5F5 → #F5F5F7 渐变 | #F0FFFE → #F5F5F7 渐变 |
| 圆角 | 16px（圆润） | 12px（利落） |
| 动画 | 心跳、飘浮、渐显 | 滑入、淡入 |
| 文案 | 温柔、可爱、情绪化 | 简洁、任务导向 |
| TabBar | 首页/点餐/订单/收藏/我的 | 任务/历史/我的 |
| 首页核心 | 今日推荐 + 决策入口 | 当前任务 + 进度条 |
| 空状态 | "还没有菜品呢，添加一个吧~" | "暂时没有任务，休息一下吧" |

### 11.4 老公端首页布局

```
┌─────────────────────────────┐
│ NavBar: 老公的任务中心        │  ← 薄荷绿渐变
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │  当前任务 (COOKING)       │ │  ← 主任务卡，进度条
│ │  番茄炒蛋                 │ │
│ │  ██████████░░░░ 60%      │ │
│ │  [完成]                   │ │
│ └─────────────────────────┘ │
│                             │
│ 待处理 (3)                   │  ← 折叠区
│ ├ 蛋炒饭                    │
│ ├ 宫保鸡丁                  │
│ └ 麻婆豆腐                  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 今日成就                  │ │  ← 情绪模块
│ │ 已完成 2/5 道 💪          │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 📋任务  📊历史  👤我的       │  ← 老公 TabBar
└─────────────────────────────┘
```

---

## 十二、API 设计优化

### 12.1 新增/修改接口

| 接口 | 方法 | 说明 | 权限 |
|------|------|------|------|
| `/api/auth/register` | POST | 注册（不选角色） | 公开 |
| `/api/auth/setup-role` | POST | 首次选角色+家庭 | 已登录 |
| `/api/orders` | POST | 批量创建订单 | order:create |
| `/api/orders/{id}/accept` | POST | 接受订单 | order:accept |
| `/api/orders/{id}/reject` | POST | 拒绝订单 | order:reject |
| `/api/orders/{id}/items/{item_id}/complete` | POST | 完成单道菜 | order:complete |
| `/api/orders/{id}/complete` | POST | 完成整单 | order:complete |
| `/api/orders/today` | GET | 今日菜单 | family member |

### 12.2 批量下单接口

```python
# 请求
POST /api/orders
{
    "items": [
        { "dish_id": "uuid-1", "notes": "多放盐" },
        { "dish_id": "uuid-2", "notes": null },
        { "dish_id": "uuid-3", "notes": "少辣" }
    ],
    "notes": "今天想吃清淡的"
}

# 响应
{
    "code": 201,
    "message": "订单已创建",
    "data": {
        "order": {
            "id": "uuid-order",
            "status": "pending",
            "items": [
                { "id": "uuid-item-1", "dish_id": "uuid-1", "status": "pending" },
                { "id": "uuid-item-2", "dish_id": "uuid-2", "status": "pending" },
                { "id": "uuid-item-3", "dish_id": "uuid-3", "status": "pending" }
            ]
        }
    }
}
```

### 12.3 订单状态更新接口

```python
# 接受订单
POST /api/orders/{id}/accept
→ order.status = "cooking"
→ 所有 items.status = "cooking"
→ 通知老婆

# 拒绝订单
POST /api/orders/{id}/reject
{ "reason": "家里没有番茄了" }
→ order.status = "rejected"
→ 通知老婆 + 拒绝理由

# 完成单道菜
POST /api/orders/{id}/items/{item_id}/complete
→ item.status = "completed"
→ 如果所有 items 都完成，自动更新 order.status = "completed"
→ 通知老婆
```

---

## 十三、消息系统升级

### 13.1 接近实时方案

**阶段一（当前）：轮询**
```typescript
// 10秒轮询未读数，有新消息时刷新列表
useEffect(() => {
  const timer = setInterval(async () => {
    const count = await fetchUnreadCount();
    if (count > lastCount) refetchMessages();
  }, 10000);
  return () => clearInterval(timer);
}, []);
```

**阶段二（未来）：WebSocket**
```python
# 使用 FastAPI WebSocket
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: UUID):
    await manager.connect(websocket, user_id)
    # 实时推送新消息和新通知
```

### 13.2 会话列表优化

```python
# 返回结构优化
class ConversationResponse(BaseModel):
    user_id: UUID
    username: str
    role: str
    avatar: str = ""          # 新增
    last_message: Optional[MessageResponse]
    unread_count: int
    online: bool = False      # 新增（WebSocket 阶段）
```

---

## 十四、实施计划

### Phase 1：基础重构（数据库 + 认证）

1. 创建 `family_members` 表，迁移角色数据
2. 创建 `orders` + `order_items` 表
3. 修改 `favorites` 唯一约束
4. 重构注册/登录流程（分步）
5. 添加权限系统

### Phase 2：订单系统

1. 实现批量下单接口
2. 实现订单状态机（accept/reject/complete）
3. 前端订单页面重构
4. 前端老公端任务页重构

### Phase 3：前端 UI 统一

1. 创建 WifeLayout / HusbandLayout
2. 统一滚动策略
3. 重构首页布局（首屏不可滚动）
4. 主题系统优化

### Phase 4：情绪化 + 细节

1. 通知模板情绪化
2. 推荐算法实现
3. 动画系统
4. 空状态设计

---

*文档版本: v5.0*
*更新日期: 2026-04-08*
