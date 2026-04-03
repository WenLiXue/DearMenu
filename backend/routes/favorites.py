from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Favorite, Dish, User
from schemas import FavoriteResponse, DishResponse
from auth import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["收藏"])


@router.get("", response_model=List[DishResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorites = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id
    ).all()

    dish_ids = [fav.dish_id for fav in favorites]
    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    return dishes


@router.post("/{dish_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜品不存在"
        )

    # 检查是否已经收藏（同一家庭内不能重复收藏同一菜品）
    existing = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id,
        Favorite.dish_id == dish_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经收藏过了"
        )

    favorite = Favorite(user_id=current_user.id, family_id=current_user.family_id, dish_id=dish_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="收藏不存在"
        )

    db.delete(favorite)
    db.commit()
