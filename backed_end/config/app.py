
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from backed_end.controller.ai_controller import router

app = FastAPI()
# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有前端域名访问，生产环境建议写具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)
app.include_router(router)
