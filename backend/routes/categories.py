from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Category, User
from schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["分类"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(Category).filter(
        Category.family_id == current_user.family_id
    ).order_by(Category.sort_order).all()
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    if category_data.name is not None:
        category.name = category_data.name
    if category_data.icon is not None:
        category.icon = category_data.icon
    if category_data.sort_order is not None:
        category.sort_order = category_data.sort_order

    db.commit()
    db.refresh(category)
    return category


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    db.delete(category)
    db.commit()
