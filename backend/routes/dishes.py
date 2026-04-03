from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Dish, User
from schemas import DishCreate, DishUpdate, DishResponse
from auth import get_current_user

router = APIRouter(prefix="/api/dishes", tags=["菜品"])


@router.get("", response_model=List[DishResponse])
def get_dishes(
    category_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dish).filter(Dish.family_id == current_user.family_id)

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    dishes = query.order_by(Dish.created_at.desc()).all()
    return dishes


@router.post("", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
def create_dish(
    dish_data: DishCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dish = Dish(
        user_id=current_user.id,
        family_id=current_user.family_id,
        name=dish_data.name,
        category_id=dish_data.category_id,
        tags=dish_data.tags,
        rating=dish_data.rating
    )
    db.add(dish)
    db.commit()
    db.refresh(dish)
    return dish


@router.put("/{dish_id}", response_model=DishResponse)
def update_dish(
    dish_id,
    dish_data: DishUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    db.commit()
    db.refresh(dish)
    return dish


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dish(
    dish_id,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
