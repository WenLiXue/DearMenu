from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# User schemas
class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: str
    family_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    family_id: Optional[UUID] = None


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    family_id: Optional[UUID] = None


# Register/Login schemas
class RegisterRequest(BaseModel):
    username: str
    password: str
    family_name: Optional[str] = None  # 创建新家庭时填写
    invite_code: Optional[str] = None  # 加入现有家庭时填写


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    family_id: Optional[UUID] = None
    username: str
    user_id: UUID


class SetupRoleRequest(BaseModel):
    role: str  # wife/husband
    family_name: Optional[str] = None
    invite_code: Optional[str] = None


# Family schemas
class FamilyResponse(BaseModel):
    id: UUID
    invite_code: str
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FamilyMemberResponse(BaseModel):
    id: UUID
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class JoinFamilyRequest(BaseModel):
    invite_code: str


class GenerateCodeResponse(BaseModel):
    invite_code: str


# Category schemas
class CategoryCreate(BaseModel):
    name: str
    icon: str = "🍽️"
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    icon: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# Dish schemas
class DishCreate(BaseModel):
    name: str
    category_id: Optional[UUID] = None
    tags: List[str] = []
    rating: int = 3


class DishUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    rating: Optional[int] = None


class DishResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: Optional[UUID]
    name: str
    tags: List[str]
    rating: int
    created_at: datetime

    class Config:
        from_attributes = True


# Admin Dish schemas (with image_url and description)
class AdminDishCreate(BaseModel):
    name: str
    category_id: Optional[UUID] = None
    tags: List[str] = []
    rating: int = 3
    image_url: Optional[str] = None
    description: Optional[str] = None


class AdminDishUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    rating: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class AdminDishResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: Optional[UUID]
    name: str
    tags: List[str]
    rating: int
    image_url: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Admin Category schemas
class AdminCategoryCreate(BaseModel):
    name: str
    icon: str = "🍽️"
    sort_order: int = 0


class AdminCategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class AdminCategoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    icon: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# Admin Stats schema
class AdminStatsResponse(BaseModel):
    total_dishes: int
    total_categories: int
    total_favorites: int
    total_history: int
    today_orders: int


# Favorite schemas
class FavoriteResponse(BaseModel):
    id: UUID
    user_id: UUID
    dish_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# History schemas
class HistoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    dish_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Husband schemas
class HusbandTaskStatusUpdate(BaseModel):
    status: str  # "cooking" or "completed"


class HusbandTaskResponse(BaseModel):
    id: UUID
    dish_id: UUID
    status: str
    created_at: datetime
    cooked_at: Optional[datetime]
    dish: DishResponse

    class Config:
        from_attributes = True


class HusbandMessageRequest(BaseModel):
    message: str


# Notification schemas
class NotificationCreate(BaseModel):
    user_id: UUID
    sender_id: Optional[UUID] = None
    type: str
    title: str
    content: Optional[str] = None


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    sender_id: Optional[UUID]
    type: str
    title: str
    content: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


# Message schemas
class MessageCreate(BaseModel):
    receiver_id: UUID
    content: str


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    sender_username: Optional[str] = None

    class Config:
        from_attributes = True


class MessageConversationResponse(BaseModel):
    user_id: UUID
    username: str
    role: str
    last_message: Optional[MessageResponse]
    unread_count: int


class MessageUnreadCountResponse(BaseModel):
    unread_count: int


# Recommendation schemas
class RecommendationFeedbackCreate(BaseModel):
    """推荐反馈创建"""
    dish_id: UUID
    feedback: str  # 'like' or 'dislike'


class RecommendationFeedbackResponse(BaseModel):
    id: UUID
    user_id: UUID
    dish_id: UUID
    feedback: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationDishResponse(BaseModel):
    """推荐菜品响应"""
    id: UUID
    user_id: UUID
    category_id: Optional[UUID]
    name: str
    tags: List[str]
    rating: int
    image_url: Optional[str]
    description: Optional[str]
    created_at: datetime
    score: float = 0.0  # 推荐得分
    reason: str = ""     # 推荐理由

    class Config:
        from_attributes = True


class SmartRecommendationResponse(BaseModel):
    """智能推荐响应"""
    dishes: List[RecommendationDishResponse]
    total: int
    cached: bool = False


# ============ 统计数据 Schemas ============

class TrendData(BaseModel):
    """趋势数据"""
    date: str
    count: int


class TopDishItem(BaseModel):
    """热门菜品项"""
    id: str
    name: str
    category_name: Optional[str] = None
    count: int
    rating: int = 3


class CategoryStatItem(BaseModel):
    """分类统计项"""
    id: str
    name: str
    icon: str = "🍽️"
    dish_count: int = 0
    order_count: int = 0
    favorite_count: int = 0


class DashboardStatsResponse(BaseModel):
    """仪表盘统计响应"""
    total_dishes: int
    total_categories: int
    total_favorites: int
    total_history: int
    today_orders: int
    today_completed: int
    today_recommendations: int
    week_total: int
    week_completed: int
    weekly_trend: List[TrendData] = []


class DailyStats(BaseModel):
    """每日统计"""
    date: str
    orders: int
    completed: int


class WeeklyStatsResponse(BaseModel):
    """本周统计响应"""
    start_date: str
    end_date: str
    daily_stats: List[DailyStats] = []
    total_orders: int
    total_completed: int
    completion_rate: float


class MonthlyStatsResponse(BaseModel):
    """本月统计响应"""
    start_date: str
    end_date: str
    total_orders: int
    total_completed: int
    completion_rate: float
    trend: List[TrendData] = []
    top_categories: List[dict] = []
    top_dishes: List[dict] = []


class TopDishesResponse(BaseModel):
    """热门菜品响应"""
    dishes: List[TopDishItem] = []
    total: int


class CategoryAnalysisResponse(BaseModel):
    """分类分析响应"""
    categories: List[CategoryStatItem] = []
    total: int


# ============ Order Schemas ============

class OrderItemCreate(BaseModel):
    dish_id: UUID
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]  # 批量下单
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    dish_id: UUID
    status: str
    notes: Optional[str] = None
    cooked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    family_id: UUID
    user_id: UUID
    status: str
    notes: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    dishes: List[DishResponse] = []  # 兼容旧接口

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str  # "pending", "cooking", "completed"


class RejectOrderRequest(BaseModel):
    reason: str


# ============ 统一响应模型 ============

from typing import Generic, TypeVar, Optional, Any

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一API响应模型"""
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class ApiListResponse(BaseModel, Generic[T]):
    """统一列表响应模型（带分页）"""
    code: int = 200
    message: str = "success"
    data: List[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20


class ErrorResponse(BaseModel):
    """统一错误响应模型"""
    code: int
    message: str
    data: Optional[Any] = None
