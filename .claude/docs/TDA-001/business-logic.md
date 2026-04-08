# DearMenu 业务逻辑文档

## 一、认证与家庭系统

### 1.1 注册流程

**入口**: `POST /api/auth/register`

```
用户输入: username, password, role, (family_name 或 invite_code)
```

**流程**:
1. 校验角色（wife/husband）、用户名唯一性
2. 根据参数决定创建或加入家庭
   - 有 invite_code → 加入已有家庭
   - 有 family_name → 创建新家庭 + 生成6位邀请码
3. 创建用户记录，bcrypt 哈希密码
4. 自动创建6个预设分类（零食🍪、饮料🥤、奶茶🧋、水果🍎、热菜🍳、熟食🍖）
5. 生成 JWT token（7天有效期）

### 1.2 登录流程

**入口**: `POST /api/auth/login`

```
用户输入: username, password
```

**流程**:
1. 查询用户 + 验证密码
2. 兼容老用户：无 role 默认为 wife，无 family_id 自动创建
3. 返回 JWT token + 用户信息

### 1.3 家庭邀请码机制

- **生成**: 6位大写随机字母
- **用途**: 新用户通过邀请码加入已有家庭
- **存储**: `Family.invite_code` 唯一约束

### 1.4 角色权限体系

| 角色 | 说明 | 权限 |
|------|------|------|
| wife | 老婆 | 点餐、收藏、分类管理 |
| husband | 老公 | 查看任务、制作餐食 |

**权限装饰器**:
- `require_role(*roles)` - 角色校验
- `require_family()` - 家庭存在性校验

---

## 二、菜品与分类系统

### 2.1 分类管理

**约束**: 同家庭内分类名称唯一（`UniqueConstraint('family_id', 'name')`）

| 操作 | 接口 | 说明 |
|------|------|------|
| 查询 | `GET /api/categories` | 按 sort_order 排序 |
| 创建 | `POST /api/categories` | 检查名称唯一性 |
| 更新 | `PUT /api/categories/{id}` | 更新时排除自身检查唯一性 |
| 删除 | `DELETE /api/categories/{id}` | 级联删除关联菜品 |

### 2.2 菜品管理

**模型**: Dish (id, user_id, family_id, category_id, name, tags[], rating, image_url, description)

| 操作 | 接口 | 说明 |
|------|------|------|
| 查询 | `GET /api/dishes` | 支持 category_id 筛选，分页 |
| 创建 | `POST /api/dishes` | 自动关联当前用户和家庭 |
| 更新 | `PUT /api/dishes/{id}` | 仅更新非空字段 |
| 删除 | `DELETE /api/dishes/{id}` | family_id 双重验证 |

### 2.3 收藏功能

**规则**: 同一家庭内同一菜品只能收藏一次

| 操作 | 接口 | 说明 |
|------|------|------|
| 查询 | `GET /api/favorites` | 分页返回收藏列表 |
| 添加 | `POST /api/favorites/{dish_id}` | wife 角色验证 + 家庭验证 |
| 取消 | `DELETE /api/favorites/{dish_id}` | 按 family_id + dish_id 删除 |

---

## 三、订单系统（核心）

### 3.1 订单状态流转

```
PENDING (待处理) → COOKING (制作中) → COMPLETED (已完成)
```

### 3.2 订单创建 (老婆点餐)

**接口**: `POST /api/orders`

```
权限: wife
流程:
1. 验证菜品存在且属于当前家庭
2. 创建 OrderHistory，status=PENDING
3. 自动通知老公: "老婆点了【xxx】，快去看看吧！"
```

### 3.3 订单状态更新 (老公操作)

**接口**: `PATCH /api/orders/{order_id}/status`

```
权限: husband
约束:
- 已完成订单不可修改
- PENDING 不能直接跳到 COMPLETED（必须先开始制作）
```

| 新状态 | 触发通知 | 内容 |
|--------|----------|------|
| COOKING | 老公开始做了 | 【xxx】开始制作啦，耐心等待~ |
| COMPLETED | 菜品已做好 | 【xxx】已完成，快来尝尝吧！ |

### 3.4 催单提醒 (老婆操作)

**接口**: `POST /api/orders/{order_id}/notify`

```
通知老公: "老婆在催【xxx】了，赶紧去看看！"
```

### 3.5 订单删除

**接口**: `DELETE /api/orders/{order_id}`

```
约束:
- 只能删除 PENDING 状态订单
- 只能删除自己创建的订单
```

---

## 四、通知系统

### 4.1 通知类型

| 类型 | 说明 |
|------|------|
| task | 任务相关（点餐、制作完成） |
| message | 消息提醒 |
| notification | 一般通知 |
| celebration | 成就庆祝 |

### 4.2 通知接口

| 接口 | 功能 |
|------|------|
| `POST /api/notifications` | 发送通知 |
| `GET /api/notifications` | 获取通知列表 |
| `PUT /api/notifications/{id}/read` | 标记已读 |
| `PUT /api/notifications/read-all` | 全部已读 |
| `DELETE /api/notifications/{id}` | 删除通知 |
| `GET /api/notifications/unread-count` | 未读数量 |

---

## 五、消息系统

### 5.1 消息发送

**接口**: `POST /api/messages`

```
验证:
- 接收者存在且同属一个家庭
- 不能给自己发消息
自动行为: 发送后创建类型为 message 的通知
```

### 5.2 对话查询

**接口**: `GET /api/messages?conversation_with={user_id}`

```
自动行为: 获取对话时将对方消息标记为已读
```

### 5.3 会话列表

**接口**: `GET /api/messages/conversations`

```
返回:
- 家庭中其他用户列表
- 每条包含最后消息、未读数量
- 按最后消息时间倒序
```

---

## 六、家庭数据隔离

### 6.1 隔离机制

所有核心模型都包含 `family_id` 外键，通过 `require_family` 依赖强制校验：

```python
query = db.query(Dish).filter(Dish.family_id == current_user.family_id)
```

### 6.2 数据模型关系

```
Family (1) ←── (*) User
                │
                ├─── (*) Category ←─── (*) Dish
                │            │
                ├─── (*) Favorite ───────┘
                ├─── (*) OrderHistory
                ├─── (*) Notification
                └─── (*) Message
```

### 6.3 级联删除

- User 删除 → 级联删除其 Category, Dish, Favorite
- Category 删除 → 其关联 Dish.category_id 设为 NULL

---

## 七、业务流程图

### 7.1 完整点餐流程

```
【老婆端】                    【老公端】
    |                            |
    |  1. 选择菜品               |
    |  2. 点击点餐 ────────────→ | 收到通知: 新点餐请求
    |                            |
    |                    3. 开始制作 ─────→ | 收到通知: 开始制作了
    |                            |
    |                    4. 完成制作 ─────→ | 收到通知: 已做好
    |                            |
    |  5. 去吃饭                 |
    |                            |
```

### 7.2 状态机

```
订单创建 ──PENDING──→ 开始制作 ──COOKING──→ 完成制作 ──COMPLETED──→ 归档
                ↓                             
            (可催单)                       
```

---

*文档更新: 2026-04-08*
