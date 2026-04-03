from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, Category, Family, UserRole, generate_invite_code
from schemas import Token, UserCreate, UserResponse, RegisterRequest, LoginRequest, LoginResponse
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/auth", tags=["认证"])

PRESET_CATEGORIES = [
    {"name": "零食", "icon": "🍪"},
    {"name": "饮料", "icon": "🥤"},
    {"name": "奶茶", "icon": "🧋"},
    {"name": "水果", "icon": "🍎"},
    {"name": "热菜", "icon": "🍳"},
    {"name": "熟食", "icon": "🍖"},
]


@router.post("/register", response_model=LoginResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # 验证角色
    if request.role not in ["wife", "husband"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="角色必须是 wife 或 husband"
        )

    # 检查用户名是否存在
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    # 处理家庭逻辑：创建新家庭或加入现有家庭
    family = None
    if request.invite_code:
        # 通过邀请码加入现有家庭
        family = db.query(Family).filter(Family.invite_code == request.invite_code.upper()).first()
        if not family:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邀请码无效"
            )
    elif request.family_name:
        # 创建新家庭
        family = Family(name=request.family_name, invite_code=generate_invite_code())
        db.add(family)
        db.commit()
        db.refresh(family)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建新家庭需要提供 family_name，加入家庭需要提供 invite_code"
        )

    # 创建用户
    hashed_password = get_password_hash(request.password)
    new_user = User(
        username=request.username,
        password_hash=hashed_password,
        role=UserRole(request.role),
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
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=request.role,
        family_id=family.id,
        username=request.username
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user_role,
        family_id=user.family_id,
        username=user.username
    )
