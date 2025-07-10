from typing import Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    disabled:bool = False
    email: Optional[str] = None
    phone_number: Optional[str] = None
