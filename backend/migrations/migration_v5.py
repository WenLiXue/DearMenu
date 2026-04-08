"""
DearMenu v5.0 Database Migration Script
执行时间: 2026-04-08

此脚本生成 v5.0 重构所需的所有 SQL 语句。

使用方法:
    python migrations/migration_v5.py

或者在 Python 中直接运行:
    exec(open('migrations/migration_v5.py').read())
"""

# ---------------------------------------------------------------
# 1. 创建 family_members 表
# ---------------------------------------------------------------
CREATE_FAMILY_MEMBERS = """
-- 创建 family_members 表（解耦用户与家庭的角色关系）
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'wife',        -- wife / husband
    status VARCHAR(20) NOT NULL DEFAULT 'active',     -- pending / active / inactive
    joined_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_family_member UNIQUE (family_id, user_id)
);
"""

# ---------------------------------------------------------------
# 2. 创建 orders + order_items 表
# ---------------------------------------------------------------
CREATE_ORDERS = """
-- 创建 orders 表（订单主表，支持批量点餐）
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 下单人
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/cooking/completed/cancelled/rejected
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,   -- 老公确认时间
    completed_at TIMESTAMPTZ    -- 完成时间
);
"""

CREATE_ORDER_ITEMS = """
-- 创建 order_items 表（订单明细，支持单道菜独立追踪）
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/cooking/completed/cancelled
    notes TEXT,
    cooked_at TIMESTAMPTZ
);
"""

# ---------------------------------------------------------------
# 3. 修改 favorites 表
# ---------------------------------------------------------------
ALTER_FAVORITES = """
-- 修改 favorites 表：移除 family_id 字段，改为个人维度 UNIQUE(user_id, dish_id)
-- 注意：需要先删除旧数据（如果有 family_id 为 NULL 的记录），
-- 然后删除 family_id 列，最后添加新的唯一约束

-- Step 1: 删除 family_id 为 NULL 的无效收藏记录（如果有）
DELETE FROM favorites WHERE family_id IS NULL;

-- Step 2: 删除旧的唯一约束（如果存在）
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS unique_family_dish;

-- Step 3: 删除 family_id 列
ALTER TABLE favorites DROP COLUMN IF EXISTS family_id;

-- Step 4: 添加新的个人维度唯一约束
ALTER TABLE favorites ADD CONSTRAINT unique_user_dish_favorite UNIQUE (user_id, dish_id);
"""

# ---------------------------------------------------------------
# 4. 数据迁移：将 User.role 和 User.family_id 迁移到 family_members
# ---------------------------------------------------------------
MIGRATE_USER_ROLE_TO_FAMILY_MEMBERS = """
-- 将现有用户的 role 和 family_id 迁移到 family_members 表
-- 注意：此迁移假设每个用户只属于一个家庭

INSERT INTO family_members (family_id, user_id, role, status, joined_at)
SELECT
    u.family_id,
    u.id,
    CASE u.role
        WHEN 'wife' THEN 'wife'
        WHEN 'husband' THEN 'husband'
        ELSE 'wife'
    END,
    'active',
    u.created_at
FROM users u
WHERE u.family_id IS NOT NULL
ON CONFLICT (family_id, user_id) DO NOTHING;
"""

# ---------------------------------------------------------------
# 完整 SQL（按顺序执行）
# ---------------------------------------------------------------
FULL_MIGRATION_SQL = f"""
-- ============================================================
-- DearMenu v5.0 数据库迁移脚本
-- 执行前请确保已备份数据库！
-- ============================================================

{BREAK_LINE}
-- Step 1: 创建 family_members 表
{BREAK_LINE}
{CREATE_FAMILY_MEMBERS}

{BREAK_LINE}
-- Step 2: 创建 orders 表
{BREAK_LINE}
{CREATE_ORDERS}

{BREAK_LINE}
-- Step 3: 创建 order_items 表
{BREAK_LINE}
{CREATE_ORDER_ITEMS}

{BREAK_LINE}
-- Step 4: 修改 favorites 表（移除 family_id，改为个人维度）
{BREAK_LINE}
{ALTER_FAVORITES}

{BREAK_LINE}
-- Step 5: 迁移现有用户角色到 family_members
{BREAK_LINE}
{MIGRATE_USER_ROLE_TO_FAMILY_MEMBERS}

{BREAK_LINE}
-- 迁移完成！
{BREAK_LINE}
"""

BREAK_LINE = "--" + "=" * 60


def print_migration():
    """打印完整迁移 SQL"""
    print(FULL_MIGRATION_SQL)


def get_sql():
    """返回完整迁移 SQL 字符串"""
    return FULL_MIGRATION_SQL


if __name__ == "__main__":
    print_migration()
