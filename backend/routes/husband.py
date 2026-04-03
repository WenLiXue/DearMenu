from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import OrderHistory, Dish, Favorite, User, TaskStatus
from schemas import HusbandTaskResponse, HusbandTaskStatusUpdate, DishResponse, HusbandMessageRequest
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/husband", tags=["老公端"])


@router.get("/tasks", response_model=List[HusbandTaskResponse])
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """
    获取今日任务 - 获取老婆今天点的还未完成的菜
    老公可以看到家庭内所有未完成的订单任务
    """
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # 获取今天创建的所有未完成订单（基于家庭ID过滤）
    tasks = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id,
        OrderHistory.created_at >= today_start,
        OrderHistory.created_at <= today_end,
        OrderHistory.status != TaskStatus.COMPLETED
    ).order_by(OrderHistory.created_at.desc()).all()

    result = []
    for task in tasks:
        dish = db.query(Dish).filter(Dish.id == task.dish_id).first()
        if dish:
            result.append(HusbandTaskResponse(
                id=task.id,
                dish_id=task.dish_id,
                status=task.status.value,
                created_at=task.created_at,
                cooked_at=task.cooked_at,
                dish=DishResponse(
                    id=dish.id,
                    user_id=dish.user_id,
                    category_id=dish.category_id,
                    name=dish.name,
                    tags=dish.tags or [],
                    rating=dish.rating,
                    created_at=dish.created_at
                )
            ))
    return result


@router.put("/tasks/{history_id}/status", response_model=HusbandTaskResponse)
def update_task_status(
    history_id: UUID,
    status_update: HusbandTaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """
    更新任务状态
    状态流转：pending（未开始） -> cooking（制作中） -> completed（已完成）
    """
    # 查找任务（基于家庭ID过滤）
    task = db.query(OrderHistory).filter(
        OrderHistory.id == history_id,
        OrderHistory.family_id == current_user.family_id
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )

    # 验证状态值
    try:
        new_status = TaskStatus(status_update.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的状态值，只支持 cooking 或 completed"
        )

    # 验证状态流转是否合法
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已完成的任务不能修改状态"
        )

    if task.status == TaskStatus.PENDING and new_status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="任务必须先开始制作才能完成"
        )

    # 更新状态
    task.status = new_status
    if new_status == TaskStatus.COMPLETED:
        task.cooked_at = datetime.now()

    db.commit()
    db.refresh(task)

    # 获取菜品信息
    dish = db.query(Dish).filter(Dish.id == task.dish_id).first()

    return HusbandTaskResponse(
        id=task.id,
        dish_id=task.dish_id,
        status=task.status.value,
        created_at=task.created_at,
        cooked_at=task.cooked_at,
        dish=DishResponse(
            id=dish.id,
            user_id=dish.user_id,
            category_id=dish.category_id,
            name=dish.name,
            tags=dish.tags or [],
            rating=dish.rating,
            created_at=dish.created_at
        )
    )


@router.get("/favorites", response_model=List[DishResponse])
def get_partner_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """
    获取老婆喜欢的菜 - 获取家庭收藏列表
    返回家庭内的收藏菜品
    """
    favorites = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id
    ).all()

    dish_ids = [fav.dish_id for fav in favorites]
    if not dish_ids:
        return []

    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    return [DishResponse(
        id=dish.id,
        user_id=dish.user_id,
        category_id=dish.category_id,
        name=dish.name,
        tags=dish.tags or [],
        rating=dish.rating,
        created_at=dish.created_at
    ) for dish in dishes]


@router.get("/history", response_model=List[HusbandTaskResponse])
def get_husband_history(
    date: Optional[date] = Query(None, description="筛选日期，格式：YYYY-MM-DD"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """
    获取已完成的历史记录
    可选按日期筛选，返回已完成的任务列表
    """
    query = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id,
        OrderHistory.status == TaskStatus.COMPLETED
    )

    if date:
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date, datetime.max.time())
        query = query.filter(
            OrderHistory.cooked_at >= date_start,
            OrderHistory.cooked_at <= date_end
        )

    tasks = query.order_by(OrderHistory.cooked_at.desc()).limit(limit).all()

    result = []
    for task in tasks:
        dish = db.query(Dish).filter(Dish.id == task.dish_id).first()
        if dish:
            result.append(HusbandTaskResponse(
                id=task.id,
                dish_id=task.dish_id,
                status=task.status.value,
                created_at=task.created_at,
                cooked_at=task.cooked_at,
                dish=DishResponse(
                    id=dish.id,
                    user_id=dish.user_id,
                    category_id=dish.category_id,
                    name=dish.name,
                    tags=dish.tags or [],
                    rating=dish.rating,
                    created_at=dish.created_at
                )
            ))
    return result


@router.post("/message")
def send_message_to_wife(
    message: HusbandMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """
    完成后发送消息通知老婆
    这是一个温馨的互动功能，老公完成后可以发送消息给老婆
    """
    # 这里可以集成实际的通知系统（如邮件、推送等）
    # 目前仅返回成功消息，实际通知可后续扩展
    return {
        "success": True,
        "message": "消息已发送",
        "content": message.message,
        "to": "亲爱的老婆",
        "from": current_user.username
    }
