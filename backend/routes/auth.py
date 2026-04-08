from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, Category, Family, UserRole, generate_invite_code
from schemas import Token, UserCreate, UserResponse, RegisterRequest, LoginRequest, LoginResponse, SetupRoleRequest
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_DAYS, get_current_user
from utils.response import success_response, error_response

router = APIRouter(prefix="/api/auth", tags=["认证"])

PRESET_CATEGORIES = [
    {"name": "零食", "icon": "🍪"},
    {"name": "饮料", "icon": "🥤"},
    {"name": "奶茶", "icon": "🧋"},
    {"name": "水果", "icon": "🍎"},
    {"name": "热菜", "icon": "🍳"},
    {"name": "熟食", "icon": "🍖"},
]


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # 检查用户名是否存在
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        return error_response(message="用户名已存在", code=status.HTTP_400_BAD_REQUEST)

    # 处理家庭逻辑：创建新家庭或加入现有家庭
    family = None
    if request.invite_code:
        # 通过邀请码加入现有家庭
        family = db.query(Family).filter(Family.invite_code == request.invite_code.upper()).first()
        if not family:
            return error_response(message="邀请码无效", code=status.HTTP_404_NOT_FOUND)
    elif request.family_name:
        # 创建新家庭
        family = Family(name=request.family_name, invite_code=generate_invite_code())
        db.add(family)
        db.commit()
        db.refresh(family)
    else:
        return error_response(
            message="创建新家庭需要提供 family_name，加入家庭需要提供 invite_code",
            code=status.HTTP_400_BAD_REQUEST
        )

    # 创建用户（不设置角色，角色通过 setup-role 设置）
    hashed_password = get_password_hash(request.password)
    new_user = User(
        username=request.username,
        password_hash=hashed_password,
        role=UserRole.WIFE,  # 默认角色，后续通过 setup-role 更新
        family_id=family.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 创建预设分类
    for i, cat_data in enumerate(PRESET_CATEGORIES):
        category = Category(
            user_id=new_user.id,
            family_id=family.id,
            name=cat_data["name"],
            icon=cat_data["icon"],
            sort_order=i
        )
        db.add(category)
    db.commit()

    # 生成 token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )

    return success_response(
        data=LoginResponse(
            access_token=access_token,
            token_type="bearer",
            role=new_user.role.value,
            family_id=str(family.id),
            username=request.username,
            user_id=new_user.id
        ).model_dump(mode='json'),
        message="注册成功"
    )


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        return error_response(message="用户名或密码错误", code=status.HTTP_401_UNAUTHORIZED)

    # 兼容老用户：没有 role 则默认为 wife
    user_role = user.role.value if user.role else "wife"
    # 兼容老用户：没有 family_id 则创建一个默认家庭
    if not user.family_id:
        family = Family(name=f"{user.username}的家庭", invite_code=generate_invite_code())
        db.add(family)
        db.commit()
        db.refresh(family)
        user.family_id = family.id
        db.commit()
        # 为老用户创建预设分类
        for i, cat_data in enumerate(PRESET_CATEGORIES):
            category = Category(
                user_id=user.id,
                family_id=family.id,
                name=cat_data["name"],
                icon=cat_data["icon"],
                sort_order=i
            )
            db.add(category)
        db.commit()

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )

    return success_response(
        data=LoginResponse(
            access_token=access_token,
            token_type="bearer",
            role=user_role,
            family_id=str(user.family_id),
            username=user.username,
            user_id=user.id
        ).model_dump(mode='json'),
        message="登录成功"
    )


@router.post("/setup-role")
def setup_role(request: SetupRoleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """设置用户角色并创建/加入家庭"""
    # 验证角色
    if request.role not in ["wife", "husband"]:
        return error_response(message="角色必须是 wife 或 husband", code=status.HTTP_400_BAD_REQUEST)

    # 处理家庭逻辑：创建新家庭或加入现有家庭
    family = None
    if request.invite_code:
        # 通过邀请码加入现有家庭
        family = db.query(Family).filter(Family.invite_code == request.invite_code.upper()).first()
        if not family:
            return error_response(message="邀请码无效", code=status.HTTP_404_NOT_FOUND)
    elif request.family_name:
        # 创建新家庭
        family = Family(name=request.family_name, invite_code=generate_invite_code())
        db.add(family)
        db.commit()
        db.refresh(family)
    else:
        return error_response(
            message="创建新家庭需要提供 family_name，加入家庭需要提供 invite_code",
            code=status.HTTP_400_BAD_REQUEST
        )

    # TODO: 创建 family_member 记录（数据库迁移后实现）
    # existing_member = db.query(FamilyMember).filter(
    #     FamilyMember.family_id == family.id,
    #     FamilyMember.user_id == current_user.id
    # ).first()
    # if existing_member:
    #     existing_member.role = request.role
    # else:
    #     new_member = FamilyMember(family_id=family.id, user_id=current_user.id, role=request.role)
    #     db.add(new_member)

    # 更新用户的 family_id 和 role
    current_user.family_id = family.id
    current_user.role = UserRole(request.role)
    db.commit()

    # 如果是新家庭，为老公创建预设分类
    if request.role == "husband":
        existing_categories = db.query(Category).filter(Category.family_id == family.id).count()
        if existing_categories == 0:
            for i, cat_data in enumerate(PRESET_CATEGORIES):
                category = Category(
                    user_id=current_user.id,
                    family_id=family.id,
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    sort_order=i
                )
                db.add(category)
            db.commit()

    return success_response(
        data={
            "role": request.role,
            "family_id": str(family.id),
            "family_name": family.name,
        },
        message="角色设置成功"
    )
