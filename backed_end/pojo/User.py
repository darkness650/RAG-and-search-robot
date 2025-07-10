from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    username: str = Field(primary_key=True)
    email: str | None = None
    disabled: bool | None = None
    phone_number: str | None = None
    hashed_password: str | None = None
    role: str = "user"


