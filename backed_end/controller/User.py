from fastapi import APIRouter, Depends
from typing import Annotated, List
from backed_end.config.database import get_session
from backed_end.config.user_mannage import get_current_active_user,get_current_admin_user
from backed_end.pojo.User import User
from backed_end.service.userservice import user_service
from backed_end.config.security import oauth2_scheme
from sqlmodel.ext.asyncio.session import AsyncSession


router = APIRouter()

@router.get("/", response_model=List[User],dependencies=[Depends(get_current_admin_user)])
async def get_users():
    return await user_service.get_all_users_service()

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user

@router.get("/{user_id}", response_model=User,dependencies=[Depends(get_current_admin_user)])
async def get_user(user_id: int):
    return await user_service.get_user_by_id_service(user_id)

@router.post("/", response_model=User,dependencies=[Depends(get_current_admin_user)])
async def create_user(user: User):
    return await user_service.create_user_service(user)

@router.delete("/{user_id}", response_model=User,dependencies=[Depends(get_current_admin_user)])
async def delete_user(user_id: int):
    return await user_service.delete_user_service(user_id)

    