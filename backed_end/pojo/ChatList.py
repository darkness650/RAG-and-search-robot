from datetime import datetime
from typing import Optional

from sqlalchemy import BIGINT
from sqlmodel import SQLModel, Field



class ChatList(SQLModel, table=True):
    chat_id: Optional[str] = Field(default=None,primary_key=True)
    username:str
    chat_name:str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # class Config:
    #     arbitrary_types_allowed = True