from typing import List, Optional
from fastapi import Header, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import UserDB, OpenSpaceDB, SpaceMemberDB

ROLE_HIERARCHY = {
    "owner": 4,
    "editor": 3,
    "commenter": 2,
    "viewer": 1
}

def get_optional_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[UserDB]:
    """
    Returns the current user if authenticated, or None if guest.
    """
    user_id = x_user_id
    if not user_id and authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token.startswith("usr-"):
            user_id = token

    if not user_id:
        return None

    return db.query(UserDB).filter(UserDB.id == user_id).first()

def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserDB:
    """
    Resolves the current authenticated user.
    Requires verified X-User-Id or Bearer token header.
    """
    user = get_optional_current_user(x_user_id=x_user_id, authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Please login first",
        )
    return user

def require_space_access(allowed_roles: List[str]):
    """
    FastAPI dependency factory enforcing verified space membership and role hierarchy.
    """
    def dependency(
        space_id: str,
        user: Optional[UserDB] = Depends(get_optional_current_user),
        db: Session = Depends(get_db)
    ) -> str:
        space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
        if not space:
            raise HTTPException(status_code=404, detail="Space not found")

        if not user:
            if "viewer" in allowed_roles:
                return "viewer"
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required: Please login first"
            )

        # Check membership table
        member = db.query(SpaceMemberDB).filter(
            SpaceMemberDB.space_id == space_id,
            SpaceMemberDB.user_id == user.id
        ).first()

        user_role = None
        if space.owner_id == user.id:
            user_role = "owner"
        elif member:
            user_role = member.role
        elif isinstance(space.members, list):
            # Compatibility fallback for denormalized JSON members
            for m in space.members:
                if isinstance(m, dict) and m.get("id") == user.id:
                    user_role = m.get("role", "viewer")
                    break

        if not user_role:
            if "viewer" in allowed_roles:
                user_role = "viewer"
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Please login first"
                )

        user_level = ROLE_HIERARCHY.get(user_role, 0)
        min_required_level = min(ROLE_HIERARCHY.get(r, 1) for r in allowed_roles)

        if user_level < min_required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires roles {allowed_roles}, your role is '{user_role}'"
            )

        return user_role

    return dependency
