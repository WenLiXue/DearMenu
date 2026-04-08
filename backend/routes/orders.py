"""
订单系统 API

支持批量下单、订单状态流转（接受/拒绝/完成）、通知模板系统。
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Order, OrderItem, OrderStatus, OrderItemStatus,
    Dish, User, Notification
)
from schemas import (
    OrderCreate, OrderItemCreate, OrderResponse,
    OrderItemResponse, DishResponse, RejectOrderRequest
)
from auth import get_current_user, require_permission, require_family
from utils.response import success_response, error_response, list_response
from services.notification_service import send_order_notification, render_template

router = APIRouter(prefix="/api/orders", tags=["订单"])


def _build_order_item_response(item: OrderItem) -> OrderItemResponse:
    """构建订单项响应"""
    return OrderItemResponse(
        id=item.id,
        order_id=item.order_id,
        dish_id=item.dish_id,
        status=item.status.value,
        notes=item.notes,
        cooked_at=item.cooked_at
    )


def _build_order_response(order: Order, db: Session) -> OrderResponse:
    """构建订单响应（包含 items 和 dishes）"""
    # 获取订单项
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    # 获取关联的菜品
    dish_ids = [item.dish_id for item in items]
    dishes_map = {
        d.id: d for d in db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    }

    # 构建 dishes 列表（兼容旧接口）
    dishes = []
    for item in items:
        dish = dishes_map.get(item.dish_id)
        if dish:
            dishes.append(DishResponse(
                id=dish.id,
                user_id=dish.user_id,
                category_id=dish.category_id,
                name=dish.name,
                tags=dish.tags or [],
                rating=dish.rating,
                created_at=dish.created_at
            ))

    return OrderResponse(
        id=order.id,
        family_id=order.family_id,
        user_id=order.user_id,
        status=order.status.value,
        notes=order.notes,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        completed_at=order.completed_at,
        items=[_build_order_item_response(item) for item in items],
        dishes=dishes
    )


def _get_dish_names(order: Order, db: Session) -> str:
    """获取订单所有菜品的名称"""
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    dish_ids = [item.dish_id for item in items]
    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    return "、".join([d.name for d in dishes]) if dishes else "未知菜品"


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:create"))
):
    """批量创建订单"""
    # 1. 验证所有菜品
    dish_ids = [item.dish_id for item in order_data.items]
    dishes = {d.id: d for d in db.query(Dish).filter(
        Dish.id.in_(dish_ids),
        Dish.family_id == current_user.family_id
    ).all()}

    if len(dishes) != len(dish_ids):
        return error_response("部分菜品不存在", code=status.HTTP_404_NOT_FOUND)

    # 2. 创建订单主表
    new_order = Order(
        family_id=current_user.family_id,
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        notes=order_data.notes
    )
    db.add(new_order)
    db.flush()

    # 3. 创建订单项
    for item in order_data.items:
        order_item = OrderItem(
            order_id=new_order.id,
            dish_id=item.dish_id,
            notes=item.notes,
            status=OrderItemStatus.PENDING
        )
        db.add(order_item)

    db.commit()

    # 4. 发送通知给老公
    dish_names = "、".join([dishes[did].name for did in dish_ids])
    send_order_notification(
        db, current_user, "new_order",
        variables={"dishes": dish_names}
    )

    return success_response(
        data=_build_order_response(new_order, db).model_dump(mode='json'),
        message="订单已创建",
        code=status.HTTP_201_CREATED
    )


@router.get("")
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取订单列表（全部订单）"""
    orders = db.query(Order).filter(
        Order.family_id == current_user.family_id
    ).order_by(Order.created_at.desc()).all()

    result = [_build_order_response(order, db).model_dump(mode='json') for order in orders]
    return list_response(data=result, total=len(result))


@router.get("/today")
def get_today_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """今日菜单 - 返回今天创建的订单及其 items"""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    orders = db.query(Order).filter(
        Order.family_id == current_user.family_id,
        Order.created_at >= today_start
    ).order_by(Order.created_at.desc()).all()

    result = [_build_order_response(order, db).model_dump(mode='json') for order in orders]
    return success_response(data=result, message="今日菜单")


@router.get("/pending")
def get_pending_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:accept"))
):
    """获取待处理订单（老公用）- 包含 pending 和 cooking 状态"""
    orders = db.query(Order).filter(
        Order.family_id == current_user.family_id,
        Order.status.in_([OrderStatus.PENDING, OrderStatus.COOKING])
    ).order_by(Order.created_at.desc()).all()

    result = [_build_order_response(order, db).model_dump(mode='json') for order in orders]
    return list_response(data=result, total=len(result))


@router.get("/{order_id}")
def get_order_detail(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取订单详情"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    return success_response(data=_build_order_response(order, db).model_dump(mode='json'))


@router.post("/{order_id}/accept")
def accept_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:accept"))
):
    """老公接受订单: pending → cooking"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status != OrderStatus.PENDING:
        return error_response("只有待处理的订单才能接受", code=status.HTTP_400_BAD_REQUEST)

    # 更新订单状态
    order.status = OrderStatus.COOKING
    order.confirmed_at = datetime.now()

    # 更新所有订单项状态
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        item.status = OrderItemStatus.COOKING

    db.commit()

    # 获取菜品名称
    dish_names = _get_dish_names(order, db)

    # 发送通知给老婆
    send_order_notification(
        db, current_user, "cooking_start",
        variables={"dish": dish_names}
    )

    return success_response(
        data=_build_order_response(order, db).model_dump(mode='json'),
        message="订单已接受，开始制作"
    )


@router.post("/{order_id}/reject")
def reject_order(
    order_id: UUID,
    body: RejectOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:reject"))
):
    """老公拒绝订单: pending/cooking → rejected"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status not in [OrderStatus.PENDING, OrderStatus.COOKING]:
        return error_response("当前状态不能拒绝订单", code=status.HTTP_400_BAD_REQUEST)

    # 更新订单状态
    order.status = OrderStatus.REJECTED

    # 更新所有订单项状态
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        item.status = OrderItemStatus.CANCELLED

    db.commit()

    # 获取菜品名称
    dish_names = _get_dish_names(order, db)

    # 发送通知给老婆
    send_order_notification(
        db, current_user, "order_rejected",
        variables={"dish": dish_names, "reason": body.reason}
    )

    return success_response(
        data=_build_order_response(order, db).model_dump(mode='json'),
        message=f"订单已拒绝：{body.reason}"
    )


@router.post("/{order_id}/items/{item_id}/complete")
def complete_order_item(
    order_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:complete"))
):
    """完成单道菜: cooking → completed"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status != OrderStatus.COOKING:
        return error_response("只有制作中的订单才能完成菜品", code=status.HTTP_400_BAD_REQUEST)

    # 查找订单项
    item = db.query(OrderItem).filter(
        OrderItem.id == item_id,
        OrderItem.order_id == order.id
    ).first()

    if not item:
        return error_response("订单项不存在", code=status.HTTP_404_NOT_FOUND)

    if item.status != OrderItemStatus.COOKING:
        return error_response("只有制作中的菜品才能标记完成", code=status.HTTP_400_BAD_REQUEST)

    # 更新订单项状态
    item.status = OrderItemStatus.COMPLETED
    item.cooked_at = datetime.now()

    # 获取菜品名称
    dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
    dish_name = dish.name if dish else "未知菜品"

    db.commit()

    # 检查是否所有 items 都完成了
    all_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    all_completed = all(item.status == OrderItemStatus.COMPLETED for item in all_items)

    if all_completed:
        order.status = OrderStatus.COMPLETED
        order.completed_at = datetime.now()
        db.commit()

        # 通知老婆全部完成
        send_order_notification(
            db, current_user, "all_complete",
            variables={"count": len(all_items)}
        )
    else:
        # 通知老婆这道菜完成了
        send_order_notification(
            db, current_user, "order_complete",
            variables={"dish": dish_name}
        )

    return success_response(
        data=_build_order_response(order, db).model_dump(mode='json'),
        message=f"【{dish_name}】已完成"
    )


@router.post("/{order_id}/complete")
def complete_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:complete"))
):
    """完成整单: cooking → completed"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status != OrderStatus.COOKING:
        return error_response("只有制作中的订单才能完成", code=status.HTTP_400_BAD_REQUEST)

    # 更新订单状态
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.now()

    # 更新所有订单项状态
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        if item.status == OrderItemStatus.COOKING:
            item.status = OrderItemStatus.COMPLETED
            item.cooked_at = datetime.now()

    db.commit()

    # 通知老婆全部完成
    send_order_notification(
        db, current_user, "all_complete",
        variables={"count": len(items)}
    )

    return success_response(
        data=_build_order_response(order, db).model_dump(mode='json'),
        message="订单已完成"
    )


@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:cancel"))
):
    """取消订单（老婆操作）: pending → cancelled"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status != OrderStatus.PENDING:
        return error_response("只能取消待处理的订单", code=status.HTTP_400_BAD_REQUEST)

    # 只能取消自己下的单
    if order.user_id != current_user.id:
        return error_response("只能取消自己创建的订单", code=status.HTTP_403_FORBIDDEN)

    # 更新订单状态
    order.status = OrderStatus.CANCELLED

    # 更新所有订单项状态
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        item.status = OrderItemStatus.CANCELLED

    db.commit()

    return success_response(message="订单已取消")


@router.post("/{order_id}/remind")
def remind_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:notify"))
):
    """催单（老婆操作）- 根据等待时间发送不同语气提醒"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status == OrderStatus.COMPLETED:
        return error_response("已完成的订单不需要催", code=status.HTTP_400_BAD_REQUEST)

    if order.status == OrderStatus.CANCELLED:
        return error_response("已取消的订单不需要催", code=status.HTTP_400_BAD_REQUEST)

    # 获取菜品名称
    dish_names = _get_dish_names(order, db)

    # 计算等待时间（分钟）
    wait_minutes = (datetime.now() - order.created_at).total_seconds() / 60

    # 根据等待时间选择提醒语气
    if wait_minutes < 10:
        template_key = "remind_gentle"
    else:
        template_key = "remind_urgent"

    # 发送提醒
    send_order_notification(
        db, current_user, template_key,
        variables={"dish": dish_names}
    )

    return success_response(message="催单提醒已发送")


@router.delete("/{order_id}")
def delete_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("order:cancel"))
):
    """删除订单（老婆操作）- 只能删除已取消或已完成的订单"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response("订单不存在", code=status.HTTP_404_NOT_FOUND)

    # 只能删除已取消、已完成或已拒绝的订单
    if order.status not in [OrderStatus.CANCELLED, OrderStatus.COMPLETED, OrderStatus.REJECTED]:
        return error_response("只能删除已取消、已完成或已拒绝的订单", code=status.HTTP_400_BAD_REQUEST)

    db.delete(order)
    db.commit()

    return success_response(message="订单已删除")
