from pydantic import BaseModel


class EmailLogin(BaseModel):
    email: str
    code: str
