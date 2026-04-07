import random
import string
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import Family, User, UserRole
from schemas import FamilyResponse, FamilyMemberResponse, JoinFamilyRequest, GenerateCodeResponse
from auth import get_current_user
from utils.response import success_response, error_response, list_response

router = APIRouter(prefix="/api/families", tags=["家庭"])


def generate_invite_code():
    """生成6位大写字母邀请码"""
    return ''.join(random.choices(string.ascii_uppercase, k=6))


@router.get("/{family_id}")
def get_family(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取家庭信息"""
    # 验证用户属于该家庭
    if current_user.family_id != family_id:
        return error_response(message="无权访问该家庭", code=status.HTTP_403_FORBIDDEN)

    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        return error_response(message="家庭不存在", code=status.HTTP_404_NOT_FOUND)

    return success_response(data=FamilyResponse.model_validate(family).model_dump(mode='json'))


@router.post("/join")
def join_family(
    request: JoinFamilyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """通过邀请码加入家庭"""
    if current_user.family_id is not None:
        return error_response(message="已经加入了一个家庭", code=status.HTTP_400_BAD_REQUEST)

    family = db.query(Family).filter(Family.invite_code == request.invite_code.upper()).first()
    if not family:
        return error_response(message="邀请码无效", code=status.HTTP_404_NOT_FOUND)

    current_user.family_id = family.id
    db.commit()
    db.refresh(current_user)

    return success_response(
        data=FamilyResponse.model_validate(family).model_dump(mode='json'),
        message="加入家庭成功"
    )


@router.get("/{family_id}/members")
def get_family_members(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取家庭成员列表"""
    # 验证用户属于该家庭
    if current_user.family_id != family_id:
        return error_response(message="无权访问该家庭", code=status.HTTP_403_FORBIDDEN)

    members = db.query(User).filter(User.family_id == family_id).all()
    member_list = [
        FamilyMemberResponse(
            id=m.id,
            username=m.username,
            role=m.role.value,
            created_at=m.created_at
        ).model_dump(mode='json')
        for m in members
    ]

    return list_response(data=member_list, total=len(member_list))


@router.post("/generate-code")
def generate_new_code(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """为当前家庭生成新的邀请码"""
    if current_user.family_id is None:
        return error_response(message="未加入任何家庭", code=status.HTTP_400_BAD_REQUEST)

    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        return error_response(message="家庭不存在", code=status.HTTP_404_NOT_FOUND)

    # 生成新的邀请码
    new_code = generate_invite_code()
    family.invite_code = new_code
    db.commit()
    db.refresh(family)

    return success_response(
        data=GenerateCodeResponse(invite_code=new_code).model_dump(mode='json'),
        message="邀请码生成成功"
    )
