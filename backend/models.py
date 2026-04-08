import uuid
import enum
import random
import string
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, ARRAY, CheckConstraint, Enum, Text, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COOKING = "cooking"
    COMPLETED = "completed"


class UserRole(str, enum.Enum):
    WIFE = "wife"
    HUSBAND = "husband"


def generate_invite_code():
    """生成6位大写字母邀请码"""
    return ''.join(random.choices(string.ascii_uppercase, k=6))


class Family(Base):
    __tablename__ = "families"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invite_code = Column(Text, unique=True, nullable=False, default=generate_invite_code)
    name = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("User", back_populates="family")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    family = relationship("Family", back_populates="members")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    dishes = relationship("Dish", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    order_history = relationship("OrderHistory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    icon = Column(String, default="🍽️")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="categories")
    family = relationship("Family")
    dishes = relationship("Dish", back_populates="category")

    __table_args__ = (
        UniqueConstraint('family_id', 'name', name='unique_category_name_per_family'),
    )


class Dish(Base):
    __tablename__ = "dishes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    tags = Column(ARRAY(String), default=list)
    rating = Column(Integer, default=3)
    image_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating"),
    )

    user = relationship("User", back_populates="dishes")
    family = relationship("Family")
    category = relationship("Category", back_populates="dishes")
    favorites = relationship("Favorite", back_populates="dish", cascade="all, delete-orphan")
    order_history = relationship("OrderHistory", back_populates="dish", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    dish = relationship("Dish", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint('user_id', 'dish_id', name='unique_user_dish_favorite'),
    )


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    COOKING = "cooking"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderItemStatus(str, enum.Enum):
    PENDING = "pending"
    COOKING = "cooking"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # 下单人
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    family = relationship("Family")
    user = relationship("User", foreign_keys=[user_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(OrderItemStatus), default=OrderItemStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    cooked_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="items")
    dish = relationship("Dish")


class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)  # 点餐备注
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cooked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="order_history")
    family = relationship("Family")
    dish = relationship("Dish", back_populates="order_history")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # 接收通知的用户
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # 发送者（可为null表示系统通知）
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # notification, message, task, celebration
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    sender = relationship("User", foreign_keys=[sender_id])
    family = relationship("Family")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    family = relationship("Family")


class RecommendationFeedback(Base):
    """推荐反馈表 - 存储用户对推荐的喜欢/不喜欢反馈"""
    __tablename__ = "recommendation_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    feedback = Column(String, nullable=False)  # 'like' or 'dislike'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendation_feedback")
    dish = relationship("Dish", back_populates="recommendation_feedback")


# 添加反向关系到 User 和 Dish 模型
User.recommendation_feedback = relationship("RecommendationFeedback", back_populates="user", cascade="all, delete-orphan")
Dish.recommendation_feedback = relationship("RecommendationFeedback", back_populates="dish", cascade="all, delete-orphan")
