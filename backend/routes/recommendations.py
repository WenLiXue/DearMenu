import random
import math
import hashlib
import json
from typing import List, Optional, Dict, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Dish, User, OrderHistory, Favorite, Category, RecommendationFeedback
from schemas import (
    DishResponse,
    RecommendationDishResponse,
    SmartRecommendationResponse,
    RecommendationFeedbackCreate,
    RecommendationFeedbackResponse
)
from auth import get_current_user, require_family
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/recommendations", tags=["智能推荐"])

# 缓存配置
CACHE_TTL_SECONDS = 600  # 10分钟
recommendation_cache: Dict[str, Tuple[SmartRecommendationResponse, datetime]] = {}

# 时间段定义
TIME_PERIODS = {
    "breakfast": (5, 10),    # 5:00 - 10:00 早餐
    "lunch": (10, 14),        # 10:00 - 14:00 Lunch
    "afternoon": (14, 17),    # 14:00 - 17:00 下午茶
    "dinner": (17, 21),       # 17:00 - 21:00 晚餐
    "night": (21, 5),         # 21:00 - 5:00 夜宵
}

# 时段对应的推荐分类关键词
TIME_PERIOD_CATEGORIES = {
    "breakfast": ["早餐", "粥", "包子", "馒头", "饼", "鸡蛋", "面包", "牛奶", "豆浆"],
    "lunch": ["主食", "米饭", "面", "炒菜", "快餐"],
    "afternoon": ["奶茶", "咖啡", "水果", "零食", "甜点", "蛋糕"],
    "dinner": ["热菜", "家常菜", "炒菜", "炖菜", "汤"],
    "night": ["夜宵", "烧烤", "小吃", "零食", "水果"],
}


def get_current_time_period() -> str:
    """获取当前时间段"""
    now = datetime.now()
    hour = now.hour
    for period, (start, end) in TIME_PERIODS.items():
        if start < end:
            if start <= hour < end:
                return period
        else:  # 跨午夜的时间段（如 night: 21-5）
            if hour >= start or hour < end:
                return period
    return "dinner"  # 默认晚餐


def get_cache_key(user_id: UUID, family_id: UUID, limit: int, include_disliked: bool = False) -> str:
    """生成缓存键"""
    data = f"{user_id}:{family_id}:{limit}:{include_disliked}"
    return hashlib.md5(data.encode()).hexdigest()


def get_cached_recommendations(cache_key: str) -> Optional[SmartRecommendationResponse]:
    """获取缓存的推荐"""
    if cache_key in recommendation_cache:
        cached_data, cached_time = recommendation_cache[cache_key]
        if datetime.now() - cached_time < timedelta(seconds=CACHE_TTL_SECONDS):
            return SmartRecommendationResponse(
                dishes=cached_data.dishes,
                total=cached_data.total,
                cached=True
            )
        else:
            del recommendation_cache[cache_key]
    return None


def set_cached_recommendations(cache_key: str, response: SmartRecommendationResponse):
    """设置推荐缓存"""
    recommendation_cache[cache_key] = (response, datetime.now())
    # 清理过期缓存
    if len(recommendation_cache) > 100:
        oldest_keys = sorted(recommendation_cache.keys(),
                            key=lambda k: recommendation_cache[k][1])[:50]
        for key in oldest_keys:
            del recommendation_cache[key]


def calculate_frequency_weight(order_history: List[OrderHistory], dish_id: UUID,
                                days: int = 30) -> float:
    """计算频率权重"""
    now = datetime.now()
    cutoff_date = now - timedelta(days=days)

    dish_orders = [o for o in order_history
                  if o.dish_id == dish_id and o.created_at >= cutoff_date]

    if not dish_orders:
        return 0.0

    weight = 0.0
    for order in dish_orders:
        days_ago = (now - order.created_at).days
        decay = math.pow(0.5, days_ago / 7)
        weight += decay

    return min(weight, 3.0)


def calculate_rating_weight(dish: Dish) -> float:
    """计算评分权重"""
    return 0.2 + (dish.rating - 1) * 0.2


def calculate_category_diversity_score(dish: Dish, selected_categories: List[UUID]) -> float:
    """计算分类多样性得分"""
    if not selected_categories:
        return 1.0

    if dish.category_id in selected_categories:
        return 0.3

    return 1.0


def calculate_time_period_score(dish: Dish, categories: List[Category]) -> float:
    """计算时间因素得分"""
    current_period = get_current_time_period()
    period_keywords = TIME_PERIOD_CATEGORIES.get(current_period, [])

    if not period_keywords:
        return 1.0

    dish_name = dish.name.lower()
    category_name = ""
    if dish.category:
        category_name = dish.category.name.lower()

    for keyword in period_keywords:
        if keyword.lower() in dish_name or keyword.lower() in category_name:
            return 1.5

    return 0.8


def calculate_feedback_weight(db: Session, user_id: UUID, dish_id: UUID,
                               user_history: List[OrderHistory]) -> Tuple[float, str]:
    """计算反馈权重"""
    feedback = db.query(RecommendationFeedback).filter(
        RecommendationFeedback.user_id == user_id,
        RecommendationFeedback.dish_id == dish_id
    ).first()

    if feedback:
        if feedback.feedback == "like":
            return 1.5, "你很喜欢这道菜"
        elif feedback.feedback == "dislike":
            return 0.1, "你不太喜欢这道菜"

    dish_order_count = sum(1 for o in user_history if o.dish_id == dish_id)
    if dish_order_count >= 3:
        return 1.3, "这是你的常点菜"

    return 1.0, ""


def calculate_smart_score(
    dish: Dish,
    categories: List[Category],
    order_history: List[OrderHistory],
    db: Session,
    user_id: UUID,
    selected_categories: List[UUID]
) -> Tuple[float, str]:
    """综合计算智能推荐分数"""
    score = 1.0
    reasons = []

    # 1. 频率权重 (权重系数: 2.0)
    freq_weight = calculate_frequency_weight(order_history, dish.id)
    if freq_weight > 0:
        score += freq_weight * 2.0
        reasons.append("常点")

    # 2. 评分权重 (权重系数: 1.5)
    rating_weight = calculate_rating_weight(dish)
    score += rating_weight * 1.5
    if dish.rating >= 4:
        reasons.append("高评分")

    # 3. 分类多样性 (权重系数: 1.0)
    diversity_score = calculate_category_diversity_score(dish, selected_categories)
    score *= diversity_score

    # 4. 时间因素 (权重系数: 1.2)
    time_score = calculate_time_period_score(dish, categories)
    score *= time_score
    if time_score > 1.0:
        reasons.append("适合现在吃")

    # 5. 反馈权重 (权重系数: 2.0)
    feedback_weight, feedback_reason = calculate_feedback_weight(
        db, user_id, dish.id, order_history
    )
    score *= feedback_weight
    if feedback_reason:
        reasons.append(feedback_reason)

    # 6. 随机性 (权重系数: 0.3)
    random_factor = 1.0 + random.random() * 0.4
    score *= random_factor

    reason = " ".join(reasons) if reasons else "推荐"
    return score, reason


@router.get("")
def get_smart_recommendations(
    limit: int = Query(5, ge=1, le=20),
    include_disliked: bool = Query(False, description="是否包含不喜欢的菜品"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取智能推荐列表"""
    cache_key = get_cache_key(current_user.id, current_user.family_id, limit, include_disliked)

    cached = get_cached_recommendations(cache_key)
    if cached:
        return success_response(data=cached.model_dump(mode='json'))

    all_dishes = db.query(Dish).filter(Dish.family_id == current_user.family_id).all()

    if not all_dishes:
        return success_response(data=SmartRecommendationResponse(dishes=[], total=0, cached=False).model_dump(mode='json'))

    if not include_disliked:
        disliked_feedbacks = db.query(RecommendationFeedback).filter(
            RecommendationFeedback.user_id == current_user.id,
            RecommendationFeedback.feedback == "dislike"
        ).all()
        disliked_dish_ids = {f.dish_id for f in disliked_feedbacks}
        all_dishes = [d for d in all_dishes if d.id not in disliked_dish_ids]

    user_history = db.query(OrderHistory).filter(
        OrderHistory.family_id == current_user.family_id
    ).order_by(OrderHistory.created_at.desc()).all()

    categories = db.query(Category).filter(
        Category.family_id == current_user.family_id
    ).all()

    dish_scores: List[Tuple[Dish, float, str]] = []
    selected_categories: List[UUID] = []

    for dish in all_dishes:
        score, reason = calculate_smart_score(
            dish, categories, user_history, db,
            current_user.id, selected_categories
        )
        dish_scores.append((dish, score, reason))

        if dish.category_id and len(selected_categories) < 5:
            if dish.category_id not in selected_categories:
                selected_categories.append(dish.category_id)

    dish_scores.sort(key=lambda x: x[1], reverse=True)

    recommended_dishes = []
    seen_categories = set()

    for dish, score, reason in dish_scores:
        if dish.category_id:
            if seen_categories.get(dish.category_id, 0) >= 3:
                continue
            seen_categories[dish.category_id] = seen_categories.get(dish.category_id, 0) + 1

        recommended_dishes.append(RecommendationDishResponse(
            id=dish.id,
            user_id=dish.user_id,
            category_id=dish.category_id,
            name=dish.name,
            tags=dish.tags or [],
            rating=dish.rating,
            image_url=dish.image_url,
            description=dish.description,
            created_at=dish.created_at,
            score=round(score, 2),
            reason=reason
        ))

        if len(recommended_dishes) >= limit:
            break

    response = SmartRecommendationResponse(
        dishes=recommended_dishes,
        total=len(recommended_dishes),
        cached=False
    )

    set_cached_recommendations(cache_key, response)

    return success_response(data=response.model_dump(mode='json'))


@router.get("/random")
def get_recommendations_random(
    limit: int = Query(3, ge=1, le=10),
    category_id: Optional[UUID] = Query(None, description="指定分类"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取随机推荐"""
    query = db.query(Dish).filter(Dish.family_id == current_user.family_id)

    if category_id:
        query = query.filter(Dish.category_id == category_id)

    all_dishes = query.all()

    if not all_dishes:
        return list_response(data=[], total=0)

    selected = random.sample(all_dishes, min(limit, len(all_dishes)))
    dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in selected]
    return list_response(data=dish_list, total=len(dish_list))


@router.get("/favorites")
def get_favorites_similar(
    limit: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """推荐类似的收藏菜品"""
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).all()

    if not favorites:
        return list_response(data=[], total=0)

    favorite_dish_ids = {f.dish_id for f in favorites}
    favorite_dishes = db.query(Dish).filter(Dish.id.in_(favorite_dish_ids)).all()

    if not favorite_dishes:
        return list_response(data=[], total=0)

    liked_tags = set()
    liked_category_ids = set()
    for dish in favorite_dishes:
        if dish.tags:
            liked_tags.update(dish.tags)
        if dish.category_id:
            liked_category_ids.add(dish.category_id)

    similar_dishes = db.query(Dish).filter(
        Dish.family_id == current_user.family_id,
        Dish.id.notin_(favorite_dish_ids)
    ).all()

    dish_similarity = []
    for dish in similar_dishes:
        score = 0
        if dish.tags:
            matching_tags = set(dish.tags) & liked_tags
            score += len(matching_tags) * 2
        if dish.category_id in liked_category_ids:
            score += 5
        if dish.rating >= 4:
            score += 2

        if score > 0:
            dish_similarity.append((dish, score))

    dish_similarity.sort(key=lambda x: x[1], reverse=True)

    top_dishes = [d for d, s in dish_similarity[:limit * 2]]
    if len(top_dishes) <= limit:
        dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in top_dishes]
        return list_response(data=dish_list, total=len(dish_list))

    selected = random.sample(top_dishes, limit)
    dish_list = [DishResponse.model_validate(d).model_dump(mode='json') for d in selected]
    return list_response(data=dish_list, total=len(dish_list))


@router.post("/feedback")
def submit_feedback(
    feedback_data: RecommendationFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """用户反馈（喜欢/不喜欢某推荐）"""
    if feedback_data.feedback not in ("like", "dislike"):
        return error_response(message="feedback 必须是 'like' 或 'dislike'", code=status.HTTP_400_BAD_REQUEST)

    dish = db.query(Dish).filter(
        Dish.id == feedback_data.dish_id,
        Dish.family_id == current_user.family_id
    ).first()

    if not dish:
        return error_response(message="菜品不存在", code=status.HTTP_404_NOT_FOUND)

    existing = db.query(RecommendationFeedback).filter(
        RecommendationFeedback.user_id == current_user.id,
        RecommendationFeedback.dish_id == feedback_data.dish_id
    ).first()

    if existing:
        existing.feedback = feedback_data.feedback
        db.commit()
        db.refresh(existing)
        clear_user_cache(current_user.id, current_user.family_id)
        return success_response(
            data=RecommendationFeedbackResponse.model_validate(existing).model_dump(mode='json'),
            message="反馈已更新"
        )

    new_feedback = RecommendationFeedback(
        user_id=current_user.id,
        dish_id=feedback_data.dish_id,
        feedback=feedback_data.feedback
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    clear_user_cache(current_user.id, current_user.family_id)

    return success_response(
        data=RecommendationFeedbackResponse.model_validate(new_feedback).model_dump(mode='json'),
        message="反馈已提交"
    )


def clear_user_cache(user_id: UUID, family_id: UUID):
    """清除用户相关的推荐缓存"""
    recommendation_cache.clear()


@router.get("/stats")
def get_recommendation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_family)
):
    """获取推荐统计数据"""
    feedback_stats = db.query(
        RecommendationFeedback.feedback,
        func.count(RecommendationFeedback.id)
    ).filter(
        RecommendationFeedback.user_id == current_user.id
    ).group_by(RecommendationFeedback.feedback).all()

    feedback_count = {"like": 0, "dislike": 0}
    for feedback, count in feedback_stats:
        if feedback in feedback_count:
            feedback_count[feedback] = count

    recent_orders = db.query(OrderHistory.dish_id).filter(
        OrderHistory.user_id == current_user.id,
        OrderHistory.created_at >= datetime.now() - timedelta(days=7)
    ).distinct().count()

    data = {
        "feedback_likes": feedback_count["like"],
        "feedback_dislikes": feedback_count["dislike"],
        "recommended_dishes_7d": recent_orders,
        "current_time_period": get_current_time_period(),
        "cache_size": len(recommendation_cache)
    }

    return success_response(data=data)
