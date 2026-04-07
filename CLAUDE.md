# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DearMenu 是一个移动端网页应用，为日常点菜提供便捷工具，支持菜品管理、收藏、历史记录和随机推荐。目标用户是老婆大人。

## 项目结构

```
DearMenu/
├── backend/                    # FastAPI 后端
│   ├── main.py                 # 应用入口
│   ├── database.py             # 数据库连接配置
│   ├── models.py               # SQLAlchemy 模型
│   ├── schemas.py              # Pydantic 请求/响应模型
│   ├── auth.py                 # JWT 认证逻辑
│   ├── requirements.txt        # Python 依赖
│   └── routes/                 # API 路由
│       ├── auth.py             # 认证路由
│       ├── categories.py       # 分类路由
│       ├── dishes.py           # 菜品路由
│       ├── favorites.py         # 收藏路由
│       ├── history.py          # 历史路由
│       └── random.py           # 随机推荐路由
│
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── api/index.ts        # API 调用封装
│   │   ├── components/         # 公共组件
│   │   │   └── Layout.tsx      # 页面布局组件
│   │   ├── contexts/           # React Context
│   │   │   └── DeviceContext.tsx
│   │   ├── hooks/              # 自定义 Hooks
│   │   │   └── useDevice.ts    # 设备检测
│   │   ├── pages/              # 页面组件
│   │   ├── stores/             # Zustand 状态管理
│   │   │   ├── authStore.ts
│   │   │   ├── categoryStore.ts
│   │   │   └── dishStore.ts
│   │   └── types/index.ts      # TypeScript 类型定义
│   └── package.json
│
├── docker-compose.yml          # PostgreSQL Docker 配置
├── SPEC.md                     # 项目规格说明
└── PROGRESS.md                 # 项目进度报告
```

## 开发命令

### 前端

```bash
cd frontend
npm install          # 安装依赖
npm run dev         # 开发服务器 (http://localhost:3007)
npm run build       # 生产构建
npm run typecheck   # TypeScript 类型检查
```

### 后端

```bash
cd backend
pip install -r requirements.txt   # 安装依赖
python main.py                    # 启动服务 (http://localhost:8000)
```

### 数据库 (Docker)

```bash
docker-compose up -d    # 启动 PostgreSQL
docker-compose down    # 停止服务
```

## 服务地址

| 服务    | 地址                       | 说明             |
| ------- | -------------------------- | ---------------- |
| 前端    | http://localhost:3000      | React 开发服务器 |
| 后端API | http://localhost:8000      | FastAPI 服务     |
| API文档 | http://localhost:8000/docs | Swagger 文档     |

## 技术栈

- **前端**: React 18 + Ant Design Mobile + Vite + Zustand + React Router
- **后端**: Python FastAPI + SQLAlchemy + Pydantic
- **数据库**: PostgreSQL 15 (Docker)
- **认证**: JWT Token

## API 设计

后端采用 RESTful API 设计，所有需要认证的接口通过 `Authorization: Bearer <token>` 头部传递 JWT。

主要路由前缀：

- `/api/auth` - 认证
- `/api/categories` - 分类管理
- `/api/dishes` - 菜品管理
- `/api/favorites` - 收藏
- `/api/history` - 历史记录
- `/api/random` - 随机推荐

## 状态管理

使用 Zustand 管理客户端状态：

- `authStore` - 用户认证状态和 Token 管理
- `categoryStore` - 分类数据
- `dishStore` - 菜品数据

## 数据库

PostgreSQL 数据库，表结构通过 SQLAlchemy 模型定义在后端 `models.py` 中，包括：

- `users` - 用户表
- `categories` - 分类表
- `dishes` - 菜品表
- `favorites` - 收藏表
- `order_history` - 历史记录表

## 预设分类

注册时自动创建6个预设分类：零食🍪、饮料🥤、奶茶🧋、水果🍎、热菜🍳、熟食🍖

## 测试账号

- 用户名: `wife003`
- 密码: `123456`
