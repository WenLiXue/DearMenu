from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Notification, User
from schemas import NotificationCreate, NotificationResponse, NotificationUnreadCountResponse
from auth import require_family
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/notifications", tags=["通知"])


# 通知类型
NOTIFICATION_TYPES = ["notification", "message", "task", "celebration"]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """发送通知"""
    # 验证通知类型
    if notification.type not in NOTIFICATION_TYPES:
        return error_response(
            message=f"通知类型必须是: {', '.join(NOTIFICATION_TYPES)}",
            code=status.HTTP_400_BAD_REQUEST
        )

    # 验证接收者存在且属于同一家庭
    recipient = db.query(User).filter(User.id == notification.user_id).first()
    if not recipient:
        return error_response(message="接收通知的用户不存在", code=status.HTTP_404_NOT_FOUND)

    if recipient.family_id != current_user.family_id:
        return error_response(message="不能向其他家庭的用户发送通知", code=status.HTTP_403_FORBIDDEN)

    # 创建通知
    new_notification = Notification(
        user_id=notification.user_id,
        sender_id=current_user.id,
        family_id=current_user.family_id,
        type=notification.type,
        title=notification.title,
        content=notification.content
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return success_response(
        data=NotificationResponse.model_validate(new_notification).model_dump(mode='json'),
        message="通知发送成功"
    )


@router.get("")
def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取当前用户通知列表"""
    notifications = db.query(Notification).filter(
        Notification.family_id == current_user.family_id,
        Notification.user_id == current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).offset(offset).limit(limit).all()

    notification_list = [NotificationResponse.model_validate(n).model_dump(mode='json') for n in notifications]
    return list_response(data=notification_list, total=len(notification_list))


@router.put("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """标记单条通知为已读"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        return error_response(message="通知不存在", code=status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return success_response(
        data=NotificationResponse.model_validate(notification).model_dump(mode='json'),
        message="通知已标记为已读"
    )


@router.put("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """全部标记已读"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return success_response(message="所有通知已标记为已读")


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """删除通知"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        return error_response(message="通知不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(notification)
    db.commit()

    return success_response(message="通知删除成功")


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取未读通知数量"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return success_response(data={"unread_count": count})
