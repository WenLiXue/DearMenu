from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Dish, Category, Favorite, OrderHistory, User, TaskStatus
from schemas import (
    DashboardStatsResponse,
    WeeklyStatsResponse,
    MonthlyStatsResponse,
    TopDishesResponse,
    CategoryAnalysisResponse,
    TrendData,
    TopDishItem,
    CategoryStatItem
)
from auth import get_current_user
from utils.response import success_response, list_response

router = APIRouter(prefix="/api/stats", tags=["数据统计"])


def get_week_start(d: date) -> date:
    """获取指定日期所在周的周一"""
    return d - timedelta(days=d.weekday())


def get_month_start(d: date) -> date:
    """获取指定日期所在月的第一天"""
    return d.replace(day=1)


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取仪表盘统计数据"""
    family_id = current_user.family_id

    # 基础统计
    total_dishes = db.query(Dish).filter(Dish.family_id == family_id).count()
    total_categories = db.query(Category).filter(Category.family_id == family_id).count()
    total_favorites = db.query(Favorite).join(Dish, Favorite.dish_id == Dish.id).filter(Dish.family_id == family_id).count()
    total_history = db.query(OrderHistory).filter(OrderHistory.family_id == family_id).count()

    # 今日统计
    today = date.today()
    today_orders = db.query(OrderHistory).filter(
        OrderHistory.family_id == family_id,
        func.date(OrderHistory.created_at) == today
    ).count()

    # 今日完成的订单
    today_completed = db.query(OrderHistory).filter(
        OrderHistory.family_id == family_id,
        func.date(OrderHistory.created_at) == today,
        OrderHistory.status == TaskStatus.COMPLETED
    ).count()

    # 今日推荐次数（今日新建的订单）
    today_recommendations = today_orders

    # 最近7天趋势数据
    week_start = get_week_start(today)
    weekly_orders = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        count = db.query(OrderHistory).filter(
            OrderHistory.family_id == family_id,
            func.date(OrderHistory.created_at) == day
        ).count()
        weekly_orders.append(TrendData(
            date=day.isoformat(),
            count=count
        ))

    # 本周总订单
    week_total = sum(d.count for d in weekly_orders)

    # 本周完成数
    week_completed = db.query(OrderHistory).filter(
        OrderHistory.family_id == family_id,
        func.date(OrderHistory.created_at) >= week_start,
        OrderHistory.status == TaskStatus.COMPLETED
    ).count()

    response = DashboardStatsResponse(
        total_dishes=total_dishes,
        total_categories=total_categories,
        total_favorites=total_favorites,
        total_history=total_history,
        today_orders=today_orders,
        today_completed=today_completed,
        today_recommendations=today_recommendations,
        week_total=week_total,
        week_completed=week_completed,
        weekly_trend=weekly_orders
    )

    return success_response(data=response.model_dump(mode='json'))


@router.get("/weekly")
def get_weekly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取本周统计数据"""
    family_id = current_user.family_id
    today = date.today()
    week_start = get_week_start(today)

    # 本周每天的订单数据
    daily_stats = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        orders_count = db.query(OrderHistory).filter(
            OrderHistory.family_id == family_id,
            func.date(OrderHistory.created_at) == day
        ).count()
        completed_count = db.query(OrderHistory).filter(
            OrderHistory.family_id == family_id,
            func.date(OrderHistory.created_at) == day,
            OrderHistory.status == TaskStatus.COMPLETED
        ).count()
        daily_stats.append({
            "date": day.isoformat(),
            "orders": orders_count,
            "completed": completed_count
        })

    # 本周总订单和完成数
    total_orders = sum(d["orders"] for d in daily_stats)
    total_completed = sum(d["completed"] for d in daily_stats)

    # 计算完成率
    completion_rate = (total_completed / total_orders * 100) if total_orders > 0 else 0

    response = WeeklyStatsResponse(
        start_date=week_start.isoformat(),
        end_date=(week_start + timedelta(days=6)).isoformat(),
        daily_stats=daily_stats,
        total_orders=total_orders,
        total_completed=total_completed,
        completion_rate=round(completion_rate, 1)
    )

    return success_response(data=response.model_dump(mode='json'))


@router.get("/monthly")
def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取本月统计数据"""
    family_id = current_user.family_id
    today = date.today()
    month_start = get_month_start(today)

    # 获取本月所有订单
    monthly_orders = db.query(OrderHistory).filter(
        OrderHistory.family_id == family_id,
        func.date(OrderHistory.created_at) >= month_start
    ).all()

    total_orders = len(monthly_orders)
    total_completed = sum(1 for o in monthly_orders if o.status == TaskStatus.COMPLETED)

    # 按日期分组统计
    daily_counts = {}
    for order in monthly_orders:
        day_key = order.created_at.date().isoformat()
        daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

    # 转换为列表
    trend_data = [
        TrendData(date=date_str, count=count)
        for date_str, count in sorted(daily_counts.items())
    ]

    # 最爱分类
    category_counts = {}
    for order in monthly_orders:
        dish = db.query(Dish).filter(Dish.id == order.dish_id).first()
        if dish and dish.category_id:
            cat = db.query(Category).filter(Category.id == dish.category_id).first()
            if cat:
                cat_name = cat.name
                category_counts[cat_name] = category_counts.get(cat_name, 0) + 1

    top_categories = sorted(
        [{"name": name, "count": count} for name, count in category_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:5]

    # 最爱菜品 Top5
    dish_counts = {}
    for order in monthly_orders:
        dish = db.query(Dish).filter(Dish.id == order.dish_id).first()
        if dish:
            dish_counts[dish.id] = {
                "id": str(dish.id),
                "name": dish.name,
                "count": dish_counts.get(dish.id, {}).get("count", 0) + 1
            }

    top_dishes = sorted(
        list(dish_counts.values()),
        key=lambda x: x["count"],
        reverse=True
    )[:5]

    # 完成率
    completion_rate = (total_completed / total_orders * 100) if total_orders > 0 else 0

    response = MonthlyStatsResponse(
        start_date=month_start.isoformat(),
        end_date=today.isoformat(),
        total_orders=total_orders,
        total_completed=total_completed,
        completion_rate=round(completion_rate, 1),
        trend=trend_data,
        top_categories=top_categories,
        top_dishes=top_dishes
    )

    return success_response(data=response.model_dump(mode='json'))


@router.get("/top-dishes")
def get_top_dishes(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取热门菜品 Top N"""
    family_id = current_user.family_id

    # 统计每个菜品的点餐次数
    dish_counts = db.query(
        OrderHistory.dish_id,
        func.count(OrderHistory.id).label("count")
    ).filter(
        OrderHistory.family_id == family_id
    ).group_by(OrderHistory.dish_id).order_by(
        func.count(OrderHistory.id).desc()
    ).limit(limit).all()

    result = []
    for dish_id, count in dish_counts:
        dish = db.query(Dish).filter(Dish.id == dish_id).first()
        if dish:
            category_name = None
            if dish.category_id:
                cat = db.query(Category).filter(Category.id == dish.category_id).first()
                if cat:
                    category_name = cat.name

            result.append(TopDishItem(
                id=str(dish.id),
                name=dish.name,
                category_name=category_name,
                count=count,
                rating=dish.rating
            ))

    response = TopDishesResponse(dishes=result, total=len(result))
    return success_response(data=response.model_dump(mode='json'))


@router.get("/category-analysis")
def get_category_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取分类分析统计"""
    family_id = current_user.family_id

    # 获取所有分类
    categories = db.query(Category).filter(
        Category.family_id == family_id
    ).all()

    result = []
    for cat in categories:
        # 统计该分类下的菜品数
        dish_count = db.query(Dish).filter(
            Dish.category_id == cat.id
        ).count()

        # 统计该分类被点餐的次数
        order_count = db.query(OrderHistory).join(Dish).filter(
            Dish.category_id == cat.id,
            OrderHistory.family_id == family_id
        ).count()

        # 统计该分类下收藏数
        favorite_count = db.query(Favorite).join(Dish, Favorite.dish_id == Dish.id).filter(
            Dish.category_id == cat.id,
            Dish.family_id == family_id
        ).count()

        result.append(CategoryStatItem(
            id=str(cat.id),
            name=cat.name,
            icon=cat.icon,
            dish_count=dish_count,
            order_count=order_count,
            favorite_count=favorite_count
        ))

    # 按点餐次数排序
    result.sort(key=lambda x: x.order_count, reverse=True)

    response = CategoryAnalysisResponse(categories=result, total=len(result))
    return success_response(data=response.model_dump(mode='json'))
