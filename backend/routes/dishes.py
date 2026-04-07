from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Dish, User
from schemas import DishCreate, DishUpdate, DishResponse
from auth import get_current_user
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/dishes", tags=["菜品"])


@router.get("")
def get_dishes(
    category_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dish).filter(Dish.family_id == current_user.family_id)

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    total = query.count()
    dishes = query.order_by(Dish.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # 返回列表响应（统一格式）
    dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in dishes]
    return list_response(data=dish_list, total=total, page=page, page_size=page_size)


@router.post("", status_code=status.HTTP_201_CREATED)
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

    return success_response(
        data=DishResponse.model_validate(dish).model_dump(mode='json'),
        message="菜品创建成功"
    )


@router.put("/{dish_id}")
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
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

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

    return success_response(
        data=DishResponse.model_validate(dish).model_dump(mode='json'),
        message="菜品更新成功"
    )


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
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(dish)
    db.commit()

    return success_response(message="菜品删除成功")
