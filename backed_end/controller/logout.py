from fastapi import APIRouter, Depends
from backed_end.config.database import redis_client
from backed_end.pojo.User import User
from backed_end.config.user_mannage import get_current_active_user

router = APIRouter()

@router.post("/")
async def logout(current_user: User = Depends(get_current_active_user)):
    redis_client.delete(f"session:{current_user.username}")
    return {"message": "已退出登录"}
