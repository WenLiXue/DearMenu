from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import Category, User
from schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from auth import get_current_user
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/categories", tags=["分类"])


@router.get("")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(Category).filter(
        Category.family_id == current_user.family_id
    ).order_by(Category.sort_order).all()

    # 返回列表响应（统一格式）
    category_list = [CategoryResponse.model_validate(c).model_dump(mode='json') for c in categories]
    return list_response(data=category_list, total=len(category_list))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 检查同家庭内是否已存在同名分类
    existing = db.query(Category).filter(
        Category.family_id == current_user.family_id,
        Category.name == category_data.name
    ).first()
    if existing:
        return error_response(message="该分类名称已存在", code=status.HTTP_400_BAD_REQUEST)

    category = Category(
        user_id=current_user.id,
        family_id=current_user.family_id,
        name=category_data.name,
        icon=category_data.icon,
        sort_order=category_data.sort_order
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return success_response(
        data=CategoryResponse.model_validate(category).model_dump(mode='json'),
        message="分类创建成功"
    )


@router.put("/{category_id}")
def update_category(
    category_id,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.family_id == current_user.family_id
    ).first()

    if not category:
        return error_response(message="分类不存在", code=status.HTTP_404_NOT_FOUND)

    # 检查名称是否与其他分类重复
    if category_data.name is not None and category_data.name != category.name:
        existing = db.query(Category).filter(
            Category.family_id == current_user.family_id,
            Category.name == category_data.name,
            Category.id != category_id
        ).first()
        if existing:
            return error_response(message="该分类名称已存在", code=status.HTTP_400_BAD_REQUEST)
        category.name = category_data.name

    if category_data.icon is not None:
        category.icon = category_data.icon
    if category_data.sort_order is not None:
        category.sort_order = category_data.sort_order

    db.commit()
    db.refresh(category)

    return success_response(
        data=CategoryResponse.model_validate(category).model_dump(mode='json'),
        message="分类更新成功"
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.family_id == current_user.family_id
    ).first()

    if not category:
        return error_response(message="分类不存在", code=status.HTTP_404_NOT_FOUND)

    db.delete(category)
    db.commit()

    return success_response(message="分类删除成功")
