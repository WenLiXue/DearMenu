"""
通知模板服务

提供情绪化的通知模板，支持模板变量替换和通知发送。
"""

from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from models import Notification, User, UserRole

# 通知模板
NOTIFICATION_TEMPLATES = {
    "new_order": {
        "title": "新的点餐请求 🍽️",
        "content": "老婆想吃{dishes}啦～快去看看吧！"
    },
    "cooking_start": {
        "title": "开始制作啦 👨‍🍳",
        "content": "【{dish}】正在制作中，请稍等片刻～"
    },
    "order_complete": {
        "title": "做好啦！快来尝尝 🎉",
        "content": "【{dish}】已经完成啦，趁热吃～"
    },
    "all_complete": {
        "title": "全部完成啦！🎊",
        "content": "今天的{count}道菜全部做好啦，快来享用吧～"
    },
    "remind_gentle": {
        "title": "温馨提醒 💕",
        "content": "老婆等【{dish}】等好久了呢～"
    },
    "remind_urgent": {
        "title": "催催催！🔥",
        "content": "再不做【{dish}】老婆要生气啦！"
    },
    "order_rejected": {
        "title": "订单被拒绝了 😢",
        "content": "老公说【{dish}】做不了，理由：{reason}"
    },
}


def render_template(template_key: str, variables: Dict[str, Any]) -> tuple:
    """
    渲染通知模板

    Returns:
        tuple: (title, content)
    """
    template = NOTIFICATION_TEMPLATES.get(template_key)
    if not template:
        return ("通知", "您有一条新通知")

    title = template["title"]
    content = template["content"]

    for key, value in variables.items():
        title = title.replace(f"{{{key}}}", str(value))
        content = content.replace(f"{{{key}}}", str(value))

    return title, content


def _notify_user(
    db: Session,
    receiver_id: UUID,
    sender_id: Optional[UUID],
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


def notify_husband(
    db: Session,
    wife_user: User,
    content_template: str,
    template_key: str,
    variables: Optional[Dict[str, Any]] = None
):
    """
    发送通知给老公（通过模板）

    Args:
        db: 数据库会话
        wife_user: 老婆用户对象
        content_template: 模板内容（兼容旧接口）
        template_key: 模板键名
        variables: 模板变量
    """
    variables = variables or {}

    # 查找老公用户
    husband = db.query(User).filter(
        User.family_id == wife_user.family_id,
        User.role == UserRole.HUSBAND
    ).first()

    if not husband:
        return

    # 使用模板系统
    title, content = render_template(template_key, variables)

    _notify_user(
        db=db,
        receiver_id=husband.id,
        sender_id=wife_user.id,
        family_id=wife_user.family_id,
        notif_type="task",
        title=title,
        content=content
    )


def notify_wife(
    db: Session,
    husband_user: User,
    template_key: str,
    variables: Optional[Dict[str, Any]] = None
):
    """
    发送通知给老婆（通过模板）

    Args:
        db: 数据库会话
        husband_user: 老公用户对象
        template_key: 模板键名
        variables: 模板变量
    """
    variables = variables or {}

    # 查找老婆用户
    wife = db.query(User).filter(
        User.family_id == husband_user.family_id,
        User.role == UserRole.WIFE
    ).first()

    if not wife:
        return

    # 使用模板系统
    title, content = render_template(template_key, variables)

    _notify_user(
        db=db,
        receiver_id=wife.id,
        sender_id=husband_user.id,
        family_id=husband_user.family_id,
        notif_type="task",
        title=title,
        content=content
    )


def send_order_notification(
    db: Session,
    sender_user: User,
    template_key: str,
    variables: Optional[Dict[str, Any]] = None
):
    """
    通用订单通知发送（根据发送者角色决定通知对象）

    Args:
        db: 数据库会话
        sender_user: 发送通知的用户
        template_key: 模板键名
        variables: 模板变量
    """
    variables = variables or {}

    if sender_user.role == UserRole.WIFE:
        notify_husband(db, sender_user, "", template_key, variables)
    elif sender_user.role == UserRole.HUSBAND:
        notify_wife(db, sender_user, template_key, variables)
