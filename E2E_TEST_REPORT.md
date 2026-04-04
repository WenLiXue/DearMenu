# DearMenu v2.2 E2E 测试报告

## 测试时间
2026-04-04

## 服务状态
| 服务 | 地址 | 状态 |
|------|------|------|
| 前端 | http://localhost:3000 | 200 OK |
| 后端 API | http://localhost:8000 | 200 OK |

---

## API 测试结果

### 1. 认证 API ✅
- **POST /api/auth/login** - ✅ PASS
- **POST /api/auth/register** - ✅ PASS

### 2. 分类 API ✅
- **GET /api/categories** - ✅ PASS (返回 6 个预设分类)

### 3. 菜品 API ⚠️
- **GET /api/dishes** - ✅ PASS
- **GET /api/dishes/{id}** - ❌ **缺失路由** (只支持 PUT/DELETE，没有 GET 单个菜品)
- **POST /api/dishes** - ✅ PASS
- **PUT /api/dishes/{id}** - ✅ PASS

### 4. 收藏 API ⚠️
- **GET /api/favorites** - ✅ PASS
- **POST /api/favorites** - ❌ **端点错误** (正确端点: POST /api/favorites/{dish_id})
- **DELETE /api/favorites/{dish_id}** - 未测试

### 5. 历史记录 API ⚠️
- **GET /api/history** - ✅ PASS
- **POST /api/history** - ❌ **端点错误** (正确端点: POST /api/history/{dish_id})
- **DELETE /api/history/{id}** - 未测试

### 6. 随机推荐 API ⚠️
- **GET /api/random** - ✅ PASS
- **GET /api/recommendations** (智能推荐) - ✅ PASS
- **GET /api/recommendations/smart** - ❌ **端点错误** (正确端点: GET /api/recommendations)
- **GET /api/recommendations/random** - ✅ PASS

### 7. 通知 API ⚠️
- **GET /api/notifications** - ✅ PASS
- **POST /api/notifications** - ❌ **422 错误** (需要提供 user_id)
- **PUT /api/notifications/{id}/read** - 未测试
- **PUT /api/notifications/read-all** - 未测试
- **DELETE /api/notifications/{id}** - 未测试
- **GET /api/notifications/unread-count** - 未测试

### 8. 消息 API ⚠️
- **GET /api/messages/conversations** - ✅ PASS
- **POST /api/messages** - ❌ **422 错误** (需要验证请求体格式)
- **GET /api/messages/{conversation_id}** - 未测试

### 9. 数据统计 API ⚠️
- **GET /api/stats/dashboard** - ✅ PASS
- **GET /api/stats/popular** - ❌ **404 错误** (正确端点: GET /api/stats/top-dishes)
- **GET /api/stats/categories** - ❌ **404 错误** (正确端点: GET /api/stats/category-analysis)
- **GET /api/stats/trends** - ❌ **404 错误** (正确端点: GET /api/stats/weekly 或 /monthly)
- **GET /api/stats/weekly** - 未测试
- **GET /api/stats/monthly** - 未测试
- **GET /api/stats/top-dishes** - 未测试
- **GET /api/stats/category-analysis** - 未测试

### 10. 推荐反馈 API ✅
- **POST /api/recommendations/feedback** - 未测试 (需要 dish_id 和 feedback)
- **GET /api/recommendations/favorites** - 未测试
- **GET /api/recommendations/stats** - 未测试

---

## 问题汇总

### Bug/缺陷
1. **缺失 GET /api/dishes/{id} 路由** - 无法获取单个菜品详情
2. **通知 POST 需要 user_id** - 当前用户给自己发通知应该自动填充 user_id

### 端点错误 (测试脚本问题，非系统问题)
1. 收藏: 应使用 `POST /api/favorites/{dish_id}`
2. 历史: 应使用 `POST /api/history/{dish_id}`
3. 智能推荐: 应使用 `GET /api/recommendations` (不是 /smart)
4. 统计热门: 应使用 `GET /api/stats/top-dishes`
5. 分类统计: 应使用 `GET /api/stats/category-analysis`
6. 趋势数据: 应使用 `GET /api/stats/weekly` 或 `/monthly`

---

## 建议修复

### 高优先级
1. 为 dishes 添加 GET /{dish_id} 路由
2. 修改 notifications 路由支持给自己发通知（自动填充 user_id）

### 中优先级
1. 更新前端 API 调用使用正确的端点
2. 添加更多统计端点的快捷方式（如 /popular -> /top-dishes）

---

## 测试脚本修正

正确的测试端点:
```powershell
# 收藏
POST /api/favorites/{dish_id}

# 历史
POST /api/history/{dish_id}

# 智能推荐
GET /api/recommendations

# 统计
GET /api/stats/top-dishes
GET /api/stats/category-analysis
GET /api/stats/weekly
GET /api/stats/monthly
```
