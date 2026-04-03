from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Dish, Category, Favorite, OrderHistory, User
from schemas import (
    AdminDishCreate, AdminDishUpdate, AdminDishResponse,
    AdminCategoryCreate, AdminCategoryUpdate, AdminCategoryResponse,
    AdminStatsResponse, FavoriteResponse, HistoryResponse
)
from auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["管理员"])


# ============ 菜品管理 ============

@router.get("/dishes", response_model=dict)
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

    return {
        "items": dishes,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/dishes", response_model=AdminDishResponse, status_code=status.HTTP_201_CREATED)
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
    return dish


@router.put("/dishes/{dish_id}", response_model=AdminDishResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜品不存在"
        )

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
    return dish


@router.delete("/dishes/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜品不存在"
        )

    db.delete(dish)
    db.commit()


# ============ 分类管理 ============

@router.get("/categories", response_model=List[AdminCategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有分类"""
    categories = db.query(Category).filter(
        Category.family_id == current_user.family_id
    ).order_by(Category.sort_order).all()
    return categories


@router.post("/categories", response_model=AdminCategoryResponse, status_code=status.HTTP_201_CREATED)
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
    return category


@router.put("/categories/{category_id}", response_model=AdminCategoryResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    if category_data.name is not None:
        category.name = category_data.name
    if category_data.icon is not None:
        category.icon = category_data.icon
    if category_data.sort_order is not None:
        category.sort_order = category_data.sort_order

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除分类（关联菜品会被设置为NULL）"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.family_id == current_user.family_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    db.delete(category)
    db.commit()


# ============ 收藏管理 ============

@router.get("/favorites", response_model=List[dict])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有收藏记录（包含菜品信息）"""
    favorites = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id
    ).order_by(Favorite.created_at.desc()).all()

    result = []
    for fav in favorites:
        dish = db.query(Dish).filter(Dish.id == fav.dish_id).first()
        if dish:
            result.append({
                "id": fav.id,
                "dish_id": fav.dish_id,
                "dish_name": dish.name,
                "dish_rating": dish.rating,
                "created_at": fav.created_at
            })
    return result


# ============ 历史记录 ============

@router.get("/history", response_model=dict)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有历史记录"""
    query = db.query(OrderHistory).filter(OrderHistory.family_id == current_user.family_id)

    if date:
        query = query.filter(func.date(OrderHistory.created_at) == date)

    total = query.count()
    history_records = query.order_by(OrderHistory.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for record in history_records:
        dish = db.query(Dish).filter(Dish.id == record.dish_id).first()
        if dish:
            result.append({
                "id": record.id,
                "dish_id": record.dish_id,
                "dish_name": dish.name,
                "dish_rating": dish.rating,
                "created_at": record.created_at
            })

    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0
    }


# ============ 统计 ============

@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取统计数据"""
    total_dishes = db.query(Dish).filter(Dish.family_id == current_user.family_id).count()
    total_categories = db.query(Category).filter(Category.family_id == current_user.family_id).count()
    total_favorites = db.query(Favorite).filter(Favorite.family_id == current_user.family_id).count()
    total_history = db.query(OrderHistory).filter(OrderHistory.family_id == current_user.family_id).count()

    today = date.today()
    today_orders = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id,
        func.date(OrderHistory.created_at) == today
    ).count()

    return AdminStatsResponse(
        total_dishes=total_dishes,
        total_categories=total_categories,
        total_favorites=total_favorites,
        total_history=total_history,
        today_orders=today_orders
    )
