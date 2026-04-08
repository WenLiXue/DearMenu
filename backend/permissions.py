from fastapi import Depends, HTTPException
from auth import get_current_user
from models import User

PERMISSIONS = {
    "wife": ["order:create", "order:cancel", "order:notify", "dish:create", "dish:update", "dish:delete", "category:manage", "favorite:manage"],
    "husband": ["order:accept", "order:reject", "order:complete", "dish:view", "message:send"],
    "admin": ["admin:all"],
}


def require_permission(permission: str):
    def dependency(current_user: User = Depends(get_current_user)):
        user_permissions = PERMISSIONS.get(current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role), [])
        if "admin:all" in user_permissions:
            return current_user
        if permission not in user_permissions:
            raise HTTPException(403, "权限不足")
        return current_user
    return dependency
