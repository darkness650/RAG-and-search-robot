from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import SQLModel, Field



class ChatList(SQLModel, table=True):
    chat_id: Optional[str] = Field(default=None,primary_key=True)
    username:str
    chat_name:str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_starred: bool = Field(default=False)
    role : str = Field(default="user")

    # class Config:
    #     arbitrary_types_allowed = True


class RenameChatRequest(BaseModel):
    chat_id: str
    new_name: str


class DeleteChatRequest(BaseModel):
    chat_id: str


class StarChatRequest(BaseModel):
    chat_id: str
    starred: bool  # True 表示收藏，False 表示取消