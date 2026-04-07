import random
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Dish, User
from schemas import DishResponse
from auth import get_current_user
from utils.response import success_response, list_response

router = APIRouter(prefix="/api/random", tags=["随机推荐"])


@router.get("")
def get_random_dishes(
    limit: int = Query(3, ge=1, le=10),
    category_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dish).filter(Dish.family_id == current_user.family_id)

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    all_dishes = query.all()

    if not all_dishes:
        return list_response(data=[], total=0)

    selected = random.sample(all_dishes, min(limit, len(all_dishes)))
    dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in selected]

    return list_response(data=dish_list, total=len(dish_list))
