from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import OrderHistory, Dish, User
from schemas import HistoryResponse, DishResponse
from auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["历史记录"])


@router.get("", response_model=List[DishResponse])
def get_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id
    ).order_by(OrderHistory.created_at.desc()).limit(limit).all()

    dish_ids = [h.dish_id for h in history]
    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    return dishes


@router.post("/{dish_id}", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
def add_history(
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

    history = OrderHistory(user_id=current_user.id, family_id=current_user.family_id, dish_id=dish_id)
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
