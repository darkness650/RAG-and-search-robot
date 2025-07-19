from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from collections.abc import AsyncGenerator
import redis

DATABASE_URL = "mysql+aiomysql://myuser:12345678@localhost:3306/dbabc"
SQLITE_URL= r"../service/SQLite/checkpoints.sqlite"
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


# Redis默认端口6379，需根据实际情况修改
redis_client = redis.StrictRedis(
    host='localhost',     # Redis服务器地址
    port=6379,            # Redis端口
    db=0,                 # Redis数据库编号
    decode_responses=True  # 自动解码为字符串
)
