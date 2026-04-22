from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Dish, Category, Favorite, User, Order
from schemas import (
    AdminDishCreate, AdminDishUpdate, AdminDishResponse,
    AdminCategoryCreate, AdminCategoryUpdate, AdminCategoryResponse,
    AdminStatsResponse
)
from auth import get_current_user
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/admin", tags=["管理员"])


# ============ 菜品管理 ============

@router.get("/dishes")
def get_dishes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有菜品（支持分页、搜索、分类筛选）"""
    query = db.query(Dish).filter(Dish.family_id == current_user.family_id)

    if search:
        query = query.filter(Dish.name.ilike(f"%{search}%"))

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    total = query.count()
    dishes = query.order_by(Dish.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # 组装返回数据，包含分类信息
    result = []
    for d in dishes:
        category = db.query(Category).filter(Category.id == d.category_id).first() if d.category_id else None
        item = AdminDishResponse.model_validate(d).model_dump(mode='json')
        item['category'] = {
            'id': str(category.id),
            'name': category.name
        } if category else None
        result.append(item)

    return success_response(
        data={
            "items": result,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    )


@router.post("/dishes", status_code=status.HTTP_201_CREATED)
def create_dish(
    dish_data: AdminDishCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建菜品"""
    dish = Dish(
        user_id=current_user.id,
        family_id=current_user.family_id,
        name=dish_data.name,
        category_id=dish_data.category_id,
        tags=dish_data.tags,
        rating=dish_data.rating,
        image_url=dish_data.image_url,
        description=dish_data.description
    )
    db.add(dish)
    db.commit()
    db.refresh(dish)

    return success_response(
        data=AdminDishResponse.model_validate(dish).model_dump(mode='json'),
        message="菜品创建成功"
    )


@router.put("/dishes/{dish_id}")
def update_dish(
    dish_id: UUID,
    dish_data: AdminDishUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新菜品"""
    dish = db.query(Dish).filter(
        Dish.id == dish_id,
        Dish.family_id == current_user.family_id
    ).first()

    if not dish:
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    if dish_data.name is not None:
        dish.name = dish_data.name
    if dish_data.category_id is not None:
        dish.category_id = dish_data.category_id
    if dish_data.tags is not None:
        dish.tags = dish_data.tags
    if dish_data.rating is not None:
        dish.rating = dish_data.rating
    if dish_data.image_url is not None:
        dish.image_url = dish_data.image_url
    if dish_data.description is not None:
        dish.description = dish_data.description

    db.commit()
    db.refresh(dish)

    return success_response(
        data=AdminDishResponse.model_validate(dish).model_dump(mode='json'),
        message="菜品更新成功"
    )


@router.delete("/dishes/{dish_id}")
def delete_dish(
    dish_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除菜品"""
    dish = db.query(Dish).filter(
        Dish.id == dish_id,
        Dish.family_id == current_user.family_id
    ).first()

    if not dish:
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(dish)
    db.commit()

    return success_response(message="菜品删除成功")


# ============ 分类管理 ============

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有分类"""
    categories = db.query(Category).filter(
        Category.family_id == current_user.family_id
    ).order_by(Category.sort_order).all()

    category_list = []
    for c in categories:
        item = AdminCategoryResponse.model_validate(c).model_dump(mode='json')
        item['dish_count'] = db.query(Dish).filter(Dish.category_id == c.id).count()
        category_list.append(item)

    return list_response(data=category_list, total=len(category_list))


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: AdminCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建分类"""
    category = Category(
        user_id=current_user.id,
        family_id=current_user.family_id,
        name=category_data.name,
        icon=category_data.icon,
        sort_order=category_data.sort_order
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return success_response(
        data=AdminCategoryResponse.model_validate(category).model_dump(mode='json'),
        message="分类创建成功"
    )


@router.put("/categories/{category_id}")
def update_category(
    category_id: UUID,
    category_data: AdminCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新分类"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.family_id == current_user.family_id
    ).first()

    if not category:
        return error_response(message="分类不存在", code=status.HTTP_404_NOT_FOUND)

    if category_data.name is not None:
        category.name = category_data.name
    if category_data.icon is not None:
        category.icon = category_data.icon
    if category_data.sort_order is not None:
        category.sort_order = category_data.sort_order

    db.commit()
    db.refresh(category)

    return success_response(
        data=AdminCategoryResponse.model_validate(category).model_dump(mode='json'),
        message="分类更新成功"
    )


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除分类"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.family_id == current_user.family_id
    ).first()

    if not category:
        return error_response(message="分类不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(category)
    db.commit()

    return success_response(message="分类删除成功")


# ============ 收藏管理 ============

@router.get("/favorites")
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有收藏记录"""
    # Favorite没有family_id，通过Dish关联查询
    favorites = db.query(Favorite).join(Dish, Favorite.dish_id == Dish.id).filter(
        Dish.family_id == current_user.family_id
    ).order_by(Favorite.created_at.desc()).all()

    result = []
    for fav in favorites:
        dish = db.query(Dish).filter(Dish.id == fav.dish_id).first()
        if dish:
            result.append({
                "id": str(fav.id),
                "dish_id": str(fav.dish_id),
                "dish_name": dish.name,
                "dish_rating": dish.rating,
                "created_at": fav.created_at.isoformat()
            })

    return list_response(data=result, total=len(result))


# ============ 历史记录 ============

@router.get("/history")
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有订单"""
    query = db.query(Order).filter(Order.family_id == current_user.family_id)

    if date:
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date, datetime.max.time())
        query = query.filter(Order.created_at >= date_start, Order.created_at <= date_end)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for order in orders:
        # 获取订单下的所有菜品名称
        dish_names = [item.dish.name for item in order.items if item.dish]
        result.append({
            "id": str(order.id),
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            "dish_names": ", ".join(dish_names) if dish_names else "-",
            "dish_count": len(dish_names),
            "created_at": order.created_at.isoformat(),
            "completed_at": order.completed_at.isoformat() if order.completed_at else None,
        })

    return success_response(
        data={
            "items": result,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0
        }
    )


# ============ 统计 ============

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取统计数据"""
    total_dishes = db.query(Dish).filter(Dish.family_id == current_user.family_id).count()
    total_categories = db.query(Category).filter(Category.family_id == current_user.family_id).count()
    total_favorites = db.query(Favorite).join(Dish, Favorite.dish_id == Dish.id).filter(Dish.family_id == current_user.family_id).count()
    total_history = db.query(Order).filter(Order.family_id == current_user.family_id).count()

    today = date.today()
    today_orders = db.query(Order).filter(
        Order.family_id == current_user.family_id,
        func.date(Order.created_at) == today
    ).count()

    # 最近5条订单
    recent_orders = db.query(Order).filter(
        Order.family_id == current_user.family_id
    ).order_by(Order.created_at.desc()).limit(5).all()
    recent_history = []
    for order in recent_orders:
        dish_names = [item.dish.name for item in order.items if item.dish]
        recent_history.append({
            "id": str(order.id),
            "dish_names": ", ".join(dish_names) if dish_names else "-",
            "dish_count": len(dish_names),
            "created_at": order.created_at.isoformat()
        })

    response = AdminStatsResponse(
        total_dishes=total_dishes,
        total_categories=total_categories,
        total_favorites=total_favorites,
        total_history=total_history,
        today_orders=today_orders
    )
    response_dict = response.model_dump(mode='json')
    response_dict['recent_history'] = recent_history

    return success_response(data=response_dict)
