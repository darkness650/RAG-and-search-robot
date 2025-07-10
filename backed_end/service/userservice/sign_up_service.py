from backed_end.pojo.UserCreate import UserCreate
from backed_end.service.userservice.user_service import create_user_service

async def sign_up_service(user_create:UserCreate,session):
    return await create_user_service(user_create,session)