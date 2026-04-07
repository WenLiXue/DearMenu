from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func

from database import get_db
from models import Message, User, Notification
from schemas import MessageCreate, MessageResponse, MessageConversationResponse, MessageUnreadCountResponse
from auth import require_family
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/messages", tags=["消息"])


@router.post("", status_code=status.HTTP_201_CREATED)
def send_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """发送消息"""
    # 验证接收者存在
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    if not receiver:
        return error_response(message="接收者不存在", code=status.HTTP_404_NOT_FOUND)

    # 验证接收者属于同一家庭
    if receiver.family_id != current_user.family_id:
        return error_response(message="不能向其他家庭的用户发送消息", code=status.HTTP_403_FORBIDDEN)

    # 不能给自己发消息
    if message.receiver_id == current_user.id:
        return error_response(message="不能给自己发送消息", code=status.HTTP_400_BAD_REQUEST)

    # 创建消息
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        family_id=current_user.family_id,
        content=message.content,
        is_read=False
    )
    db.add(new_message)

    # 自动创建通知（类型为 message）
    notification = Notification(
        user_id=message.receiver_id,
        sender_id=current_user.id,
        family_id=current_user.family_id,
        type="message",
        title="新消息",
        content=message.content[:100] if len(message.content) > 100 else message.content
    )
    db.add(notification)

    db.commit()
    db.refresh(new_message)

    # 返回消息响应（包含发送者用户名）
    msg_response = MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        receiver_id=new_message.receiver_id,
        content=new_message.content,
        is_read=new_message.is_read,
        created_at=new_message.created_at,
        sender_username=current_user.username
    )

    return success_response(data=msg_response.model_dump(), message="消息发送成功")


@router.get("")
def get_conversation(
    conversation_with: UUID = Query(..., description="对方用户ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取与某用户的对话"""
    # 验证对方用户存在且属于同一家庭
    other_user = db.query(User).filter(User.id == conversation_with).first()
    if not other_user:
        return error_response(message="用户不存在", code=status.HTTP_404_NOT_FOUND)

    if other_user.family_id != current_user.family_id:
        return error_response(message="不能查看与其他家庭用户的对话", code=status.HTTP_403_FORBIDDEN)

    # 获取对话消息（双向）
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == conversation_with),
            and_(Message.sender_id == conversation_with, Message.receiver_id == current_user.id)
        )
    ).order_by(
        Message.created_at.desc()
    ).offset(offset).limit(limit).all()

    # 标记对方发送的消息为已读
    db.query(Message).filter(
        Message.sender_id == conversation_with,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    # 构建响应（包含对方用户名）
    result = []
    for msg in messages:
        sender_username = current_user.username if msg.sender_id == current_user.id else other_user.username
        result.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_username=sender_username
        ))

    return list_response(data=[r.model_dump() for r in result], total=len(result))


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取所有会话列表"""
    # 获取家庭中所有其他用户
    other_users = db.query(User).filter(
        User.family_id == current_user.family_id,
        User.id != current_user.id
    ).all()

    conversations = []
    for other_user in other_users:
        # 获取与该用户的最后一条消息
        last_message = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user.id),
                and_(Message.sender_id == other_user.id, Message.receiver_id == current_user.id)
            )
        ).order_by(
            Message.created_at.desc()
        ).first()

        # 获取未读消息数量
        unread_count = db.query(Message).filter(
            Message.sender_id == other_user.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()

        last_msg_response = None
        if last_message:
            last_msg_response = MessageResponse(
                id=last_message.id,
                sender_id=last_message.sender_id,
                receiver_id=last_message.receiver_id,
                content=last_message.content,
                is_read=last_message.is_read,
                created_at=last_message.created_at,
                sender_username=current_user.username if last_message.sender_id == current_user.id else other_user.username
            )

        conversations.append(MessageConversationResponse(
            user_id=other_user.id,
            username=other_user.username,
            role=other_user.role.value if hasattr(other_user.role, 'value') else other_user.role,
            last_message=last_msg_response,
            unread_count=unread_count
        ))

    # 按最后消息时间排序
    conversations.sort(
        key=lambda x: x.last_message.created_at if x.last_message else None,
        reverse=True
    )

    return success_response(data=[c.model_dump() for c in conversations])


@router.put("/{message_id}/read")
def mark_message_as_read(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """标记消息为已读"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.receiver_id == current_user.id
    ).first()

    if not message:
        return error_response(message="消息不存在", code=status.HTTP_404_NOT_FOUND)

    message.is_read = True
    db.commit()
    db.refresh(message)

    # 获取发送者用户名
    sender = db.query(User).filter(User.id == message.sender_id).first()
    sender_username = sender.username if sender else None

    msg_response = MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender_username=sender_username
    )

    return success_response(data=msg_response.model_dump(), message="消息已标记为已读")


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取未读消息数量"""
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()

    return success_response(data={"unread_count": count})
