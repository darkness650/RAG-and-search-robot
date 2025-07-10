from fastapi import APIRouter, Depends, Form, File, UploadFile
from ipywidgets.embed import dependency_state
from sqlalchemy import false

from backed_end.pojo.User import User
from backed_end.pojo.question import question
from backed_end.service.aiservice.aiservice import service
from backed_end.config.user_mannage import get_current_active_user
from typing import Annotated, Optional, List
from backed_end.service.userservice import upload_service
router = APIRouter()
@router.post("/")
async def ai(question: Annotated[str,Form()],user:Annotated[User,Depends(get_current_active_user)],
             web_search:Annotated[bool,Form()]=False,files:Optional[List[UploadFile]]=File(None)):
    has_file = bool(files and len(files) > 0)

    if has_file:
        for file in files:
            upload_service.upload_file_service(file,user.username)
    result = service(question,user.username,web_search,has_file)
    return {"result": result}