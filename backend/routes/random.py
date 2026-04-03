import random
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Dish, User
from schemas import DishResponse
from auth import get_current_user

router = APIRouter(prefix="/api/random", tags=["随机推荐"])


@router.get("", response_model=List[DishResponse])
def get_random_dishes(
    limit: int = Query(3, ge=1, le=10),
    category_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dish).filter(Dish.user_id == current_user.id)

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    all_dishes = query.all()

    if not all_dishes:
        return []

    selected = random.sample(all_dishes, min(limit, len(all_dishes)))
    return selected
