import asyncio
import sys

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backed_end.config.database import create_db_and_tables
from backed_end.config.user_mannage import get_current_active_user, get_current_admin_user



from backed_end.controller import ai_controller
from backed_end.controller import User
from backed_end.controller import token
from backed_end.controller import sign_up
from backed_end.controller import chat_list


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan

              )
# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有前端域名访问，生产环境建议写具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)
app.include_router(ai_controller.router,prefix="/ai", tags=["ai"],dependencies=[Depends(get_current_active_user)])
app.include_router(User.router, prefix="/users", tags=["用户"],dependencies=[Depends(get_current_active_user)])
app.include_router(chat_list.router, prefix="/chat_list", tags=["聊天列表"],dependencies=[Depends(get_current_active_user)])
app.include_router(token.router,prefix="/token",tags=["登录"])
app.include_router(sign_up.router,prefix="/sign_up",tags=["注册"])
