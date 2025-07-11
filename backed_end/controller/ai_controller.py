import os
from fastapi import APIRouter, Depends, Form, File, UploadFile
from backed_end.pojo.User import User
from backed_end.service.aiservice.aiservice import service
from backed_end.config.user_mannage import get_current_active_user
from typing import Annotated, Optional, List

from backed_end.service.aiservice.history_message import show_history_message
from backed_end.service.userservice import upload_service
router = APIRouter()
@router.post("/chat")
async def ai(question: Annotated[str,Form()],user:Annotated[User,Depends(get_current_active_user)],
             web_search:Annotated[bool,Form()]=False,files:Optional[List[UploadFile]]=File(None)):
    has_file = bool(files and len(files) > 0)
    uploaded_file_paths = []
    try:
        if has_file:
            for file in files:
                file_info = upload_service.upload_file_service(file, user.username)
                uploaded_file_paths.append(file_info["filepath"])
                await file.close()

        result = await service(question, user.username, web_search, has_file)

    finally:
        for path in uploaded_file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"❗ Failed to delete file {path}: {e}")

    return {"result": result}

@router.post("/history")
async def history(session_id: str):
     return await show_history_message(session_id)