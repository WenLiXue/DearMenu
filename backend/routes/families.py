import random
import string
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Family, User, UserRole
from schemas import FamilyResponse, FamilyMemberResponse, JoinFamilyRequest, GenerateCodeResponse
from auth import get_current_user

router = APIRouter(prefix="/api/families", tags=["家庭"])


def generate_invite_code():
    """生成6位大写字母邀请码"""
    return ''.join(random.choices(string.ascii_uppercase, k=6))


@router.get("/{family_id}", response_model=FamilyResponse)
def get_family(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取家庭信息"""
    # 验证用户属于该家庭
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该家庭"
        )

    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="家庭不存在"
        )
    return family


@router.post("/join", response_model=FamilyResponse, status_code=status.HTTP_200_OK)
def join_family(
    request: JoinFamilyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """通过邀请码加入家庭"""
    if current_user.family_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经加入了一个家庭"
        )

    family = db.query(Family).filter(Family.invite_code == request.invite_code.upper()).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码无效"
        )

    current_user.family_id = family.id
    db.commit()
    db.refresh(current_user)

    return family


@router.get("/{family_id}/members", response_model=List[FamilyMemberResponse])
def get_family_members(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取家庭成员列表"""
    # 验证用户属于该家庭
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该家庭"
        )

    members = db.query(User).filter(User.family_id == family_id).all()
    return [FamilyMemberResponse(
        id=m.id,
        username=m.username,
        role=m.role.value,
        created_at=m.created_at
    ) for m in members]


@router.post("/generate-code", response_model=GenerateCodeResponse)
def generate_new_code(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """为当前家庭生成新的邀请码"""
    if current_user.family_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未加入任何家庭"
        )

    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="家庭不存在"
        )

    # 生成新的邀请码
    new_code = generate_invite_code()
    family.invite_code = new_code
    db.commit()
    db.refresh(family)

    return GenerateCodeResponse(invite_code=new_code)
