from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Notification, User
from schemas import NotificationCreate, NotificationResponse, NotificationUnreadCountResponse
from auth import require_family

router = APIRouter(prefix="/api/notifications", tags=["通知"])


# 通知类型
NOTIFICATION_TYPES = ["notification", "message", "task", "celebration"]


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """发送通知"""
    # 验证通知类型
    if notification.type not in NOTIFICATION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"通知类型必须是: {', '.join(NOTIFICATION_TYPES)}"
        )

    # 验证接收者存在且属于同一家庭
    recipient = db.query(User).filter(User.id == notification.user_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="接收通知的用户不存在"
        )

    if recipient.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="不能向其他家庭的用户发送通知"
        )

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
    return new_notification


@router.get("", response_model=List[NotificationResponse])
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

    return notifications


@router.put("/{notification_id}/read", response_model=NotificationResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在"
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
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
    return None


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在"
        )

    db.delete(notification)
    db.commit()
    return None


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取未读通知数量"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return NotificationUnreadCountResponse(unread_count=count)
