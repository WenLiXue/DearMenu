from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import OrderHistory, Dish, User, Notification, TaskStatus, UserRole
from schemas import OrderCreate, OrderResponse, OrderStatusUpdate, DishResponse
from auth import get_current_user, require_role, require_family
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/orders", tags=["订单"])


def _get_order_with_dish(order: OrderHistory, db: Session) -> OrderResponse:
    """构建带菜品信息的订单响应"""
    dish = db.query(Dish).filter(Dish.id == order.dish_id).first()
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        dish_id=order.dish_id,
        status=order.status.value,
        notes=order.notes,
        created_at=order.created_at,
        cooked_at=order.cooked_at,
        dish=DishResponse(
            id=dish.id,
            user_id=dish.user_id,
            category_id=dish.category_id,
            name=dish.name,
            tags=dish.tags or [],
            rating=dish.rating,
            created_at=dish.created_at
        ) if dish else None
    )


def _send_notification_to_user(
    db: Session,
    receiver_id: UUID,
    sender_id: UUID,
    family_id: UUID,
    notif_type: str,
    title: str,
    content: Optional[str] = None
):
    """发送通知给指定用户"""
    notification = Notification(
        user_id=receiver_id,
        sender_id=sender_id,
        family_id=family_id,
        type=notif_type,
        title=title,
        content=content
    )
    db.add(notification)
    db.commit()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("wife"))
):
    """创建订单（老婆点餐）"""
    # 验证菜品存在且属于当前家庭
    dish = db.query(Dish).filter(
        Dish.id == order_data.dish_id,
        Dish.family_id == current_user.family_id
    ).first()

    if not dish:
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    # 创建订单记录
    new_order = OrderHistory(
        user_id=current_user.id,
        family_id=current_user.family_id,
        dish_id=order_data.dish_id,
        status=TaskStatus.PENDING,
        notes=order_data.notes
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 查找老公用户，推送通知
    husband = db.query(User).filter(
        User.family_id == current_user.family_id,
        User.role == UserRole.HUSBAND
    ).first()

    if husband:
        _send_notification_to_user(
            db=db,
            receiver_id=husband.id,
            sender_id=current_user.id,
            family_id=current_user.family_id,
            notif_type="task",
            title="新点餐请求",
            content=f"老婆点了【{dish.name}】，快去看看吧！"
        )

    return success_response(
        data=_get_order_with_dish(new_order, db).model_dump(mode='json'),
        message="订单已创建",
        code=status.HTTP_201_CREATED
    )


@router.get("")
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取订单列表"""
    orders = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id
    ).order_by(OrderHistory.created_at.desc()).all()

    result = [_get_order_with_dish(order, db).model_dump(mode='json') for order in orders]
    return list_response(data=result, total=len(result))


@router.get("/pending")
def get_pending_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """获取待处理订单（老公用）"""
    orders = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id,
        OrderHistory.status.in_([TaskStatus.PENDING, TaskStatus.COOKING])
    ).order_by(OrderHistory.created_at.desc()).all()

    result = [_get_order_with_dish(order, db).model_dump(mode='json') for order in orders]
    return list_response(data=result, total=len(result))


@router.get("/{order_id}")
def get_order_detail(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取订单详情"""
    order = db.query(OrderHistory).filter(
        OrderHistory.id == order_id,
        OrderHistory.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response(message="订单不存在", code=status.HTTP_404_NOT_FOUND)

    return success_response(data=_get_order_with_dish(order, db).model_dump(mode='json'))


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("husband"))
):
    """更新订单状态（老公操作）"""
    order = db.query(OrderHistory).filter(
        OrderHistory.id == order_id,
        OrderHistory.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response(message="订单不存在", code=status.HTTP_404_NOT_FOUND)

    try:
        new_status = TaskStatus(status_update.status)
    except ValueError:
        return error_response(message="无效的状态值，只支持 pending、cooking 或 completed", code=status.HTTP_400_BAD_REQUEST)

    if order.status == TaskStatus.COMPLETED:
        return error_response(message="已完成的任务不能修改状态", code=status.HTTP_400_BAD_REQUEST)

    if order.status == TaskStatus.PENDING and new_status == TaskStatus.COMPLETED:
        return error_response(message="任务必须先开始制作才能完成", code=status.HTTP_400_BAD_REQUEST)

    order.status = new_status
    if new_status == TaskStatus.COMPLETED:
        order.cooked_at = datetime.now()

    db.commit()
    db.refresh(order)

    # 获取老婆用户，发送通知
    wife = db.query(User).filter(
        User.family_id == current_user.family_id,
        User.role == UserRole.WIFE
    ).first()

    dish = db.query(Dish).filter(Dish.id == order.dish_id).first()
    dish_name = dish.name if dish else "未知菜品"

    if wife and new_status in [TaskStatus.COOKING, TaskStatus.COMPLETED]:
        if new_status == TaskStatus.COOKING:
            title = "老公开始做了"
            content = f"【{dish_name}】开始制作啦，耐心等待~"
        else:
            title = "菜品已做好"
            content = f"【{dish_name}】已完成，快来尝尝吧！"

        _send_notification_to_user(
            db=db,
            receiver_id=wife.id,
            sender_id=current_user.id,
            family_id=current_user.family_id,
            notif_type="task",
            title=title,
            content=content
        )

    return success_response(
        data=_get_order_with_dish(order, db).model_dump(mode='json'),
        message="状态更新成功"
    )


@router.post("/{order_id}/notify")
def send_order_reminder(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("wife"))
):
    """主动通知提醒（老婆操作）"""
    order = db.query(OrderHistory).filter(
        OrderHistory.id == order_id,
        OrderHistory.family_id == current_user.family_id
    ).first()

    if not order:
        return error_response(message="订单不存在", code=status.HTTP_404_NOT_FOUND)

    if order.status == TaskStatus.COMPLETED:
        return error_response(message="已完成的订单不需要提醒", code=status.HTTP_400_BAD_REQUEST)

    # 查找老公用户
    husband = db.query(User).filter(
        User.family_id == current_user.family_id,
        User.role == UserRole.HUSBAND
    ).first()

    if not husband:
        return error_response(message="当前家庭没有老公用户", code=status.HTTP_404_NOT_FOUND)

    dish = db.query(Dish).filter(Dish.id == order.dish_id).first()
    dish_name = dish.name if dish else "未知菜品"

    _send_notification_to_user(
        db=db,
        receiver_id=husband.id,
        sender_id=current_user.id,
        family_id=current_user.family_id,
        notif_type="task",
        title="点餐提醒",
        content=f"老婆在催【{dish_name}】了，赶紧去看看！"
    )

    return success_response(message="提醒已发送")
