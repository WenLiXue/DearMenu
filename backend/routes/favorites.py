from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Favorite, Dish, User
from schemas import FavoriteResponse, DishResponse
from auth import get_current_user
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/favorites", tags=["收藏"])


@router.get("")
def get_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorites = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id
    )

    total = favorites.count()
    favorite_records = favorites.order_by(Favorite.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    dish_ids = [fav.dish_id for fav in favorite_records]
    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()

    # 返回列表响应（统一格式）
    dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in dishes]
    return list_response(data=dish_list, total=total, page=page, page_size=page_size)


@router.post("/{dish_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    dish_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 检查菜品是否存在且属于当前家庭
    dish = db.query(Dish).filter(
        Dish.id == dish_id,
        Dish.family_id == current_user.family_id
    ).first()

    if not dish:
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    # 检查是否已经收藏（同一家庭内不能重复收藏同一菜品）
    existing = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id,
        Favorite.dish_id == dish_id
    ).first()

    if existing:
        return error_response(message="已经收藏过了", code=status.HTTP_400_BAD_REQUEST)

    favorite = Favorite(user_id=current_user.id, family_id=current_user.family_id, dish_id=dish_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    return success_response(
        data=FavoriteResponse.model_validate(favorite).model_dump(mode='json'),
        message="收藏成功"
    )


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    dish_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorite = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id,
        Favorite.dish_id == dish_id
    ).first()

    if not favorite:
        return error_response(message="收藏不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(favorite)
    db.commit()

    return success_response(message="取消收藏成功")
