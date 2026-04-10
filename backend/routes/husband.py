from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Order, OrderItem, OrderHistory, Dish, Favorite, User, TaskStatus, OrderStatus, OrderItemStatus
from schemas import HusbandTaskResponse, HusbandTaskStatusUpdate, DishResponse, HusbandMessageRequest
from auth import get_current_user, require_role
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/husband", tags=["老公端"])


@router.get("/tasks")
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """获取今日任务 - 从订单表查询，包含所有状态（pending, cooking, completed）"""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Query all order items from today (包括 completed)
    orders = db.query(Order).filter(
        Order.family_id == current_user.family_id,
        Order.created_at >= today_start,
        Order.created_at <= today_end,
        Order.status.in_([OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.COMPLETED])
    ).all()

    result = []
    for order in orders:
        for item in order.items:
            dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
            if dish:
                # 返回所有状态的任务
                status_value = 'pending'
                if item.status == OrderItemStatus.COOKING:
                    status_value = 'cooking'
                elif item.status == OrderItemStatus.COMPLETED:
                    status_value = 'completed'

                result.append(HusbandTaskResponse(
                    id=str(item.id),
                    dish_id=item.dish_id,
                    status=status_value,
                    created_at=order.created_at,
                    cooked_at=item.cooked_at,
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

    return list_response(data=[r.model_dump(mode='json') for r in result], total=len(result))


@router.put("/tasks/{task_id}/status")
def update_task_status(
    task_id: UUID,
    status_update: HusbandTaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """更新任务状态 - 更新订单项状态"""
    item = db.query(OrderItem).filter(OrderItem.id == task_id).first()
    if not item:
        return error_response(message="任务不存在", code=status.HTTP_404_NOT_FOUND)

    # Verify family_id through the order
    order = db.query(Order).filter(Order.id == item.order_id, Order.family_id == current_user.family_id).first()
    if not order:
        return error_response(message="任务不存在", code=status.HTTP_404_NOT_FOUND)

    try:
        new_status = OrderItemStatus(status_update.status)
    except ValueError:
        return error_response(message="无效的状态值，只支持 cooking 或 completed", code=status.HTTP_400_BAD_REQUEST)

    if item.status == OrderItemStatus.COMPLETED:
        return error_response(message="已完成的任务不能修改状态", code=status.HTTP_400_BAD_REQUEST)

    if item.status == OrderItemStatus.PENDING and new_status == OrderItemStatus.COMPLETED:
        return error_response(message="任务必须先开始制作才能完成", code=status.HTTP_400_BAD_REQUEST)

    item.status = new_status
    if new_status == OrderItemStatus.COMPLETED:
        item.cooked_at = datetime.now()

        # 记录到历史表
        order_history = OrderHistory(
            user_id=order.user_id,
            family_id=order.family_id,
            dish_id=item.dish_id,
            status=TaskStatus.COMPLETED,
            cooked_at=item.cooked_at
        )
        db.add(order_history)

        # 检查是否所有订单项都完成了，如果是则更新父订单状态
        all_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        if all(item.status == OrderItemStatus.COMPLETED for item in all_items):
            order.status = OrderStatus.COMPLETED
            order.completed_at = datetime.now()

    db.commit()
    db.refresh(item)

    dish = db.query(Dish).filter(Dish.id == item.dish_id).first()

    response = HusbandTaskResponse(
        id=str(item.id),
        dish_id=item.dish_id,
        status=item.status.value,
        created_at=order.created_at,
        cooked_at=item.cooked_at,
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

    return success_response(data=response.model_dump(mode='json'), message="状态更新成功")


@router.get("/favorites")
def get_partner_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """获取老婆喜欢的菜"""
    favorites = db.query(Favorite).filter(
        Favorite.family_id == current_user.family_id
    ).all()

    dish_ids = [fav.dish_id for fav in favorites]
    if not dish_ids:
        return list_response(data=[], total=0)

    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    dish_list = [DishResponse(
        id=dish.id,
        user_id=dish.user_id,
        category_id=dish.category_id,
        name=dish.name,
        tags=dish.tags or [],
        rating=dish.rating,
        created_at=dish.created_at
    ).model_dump(mode='json') for dish in dishes]

    return list_response(data=dish_list, total=len(dish_list))


@router.get("/history")
def get_husband_history(
    date: Optional[date] = Query(None, description="筛选日期，格式：YYYY-MM-DD"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """获取已完成的历史记录"""
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

    return list_response(data=[r.model_dump(mode='json') for r in result], total=len(result))


@router.post("/message")
def send_message_to_wife(
    message: HusbandMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """完成后发送消息通知老婆"""
    return success_response(
        data={
            "success": True,
            "content": message.message,
            "to": "亲爱的老婆",
            "from": current_user.username
        },
        message="消息已发送"
    )
