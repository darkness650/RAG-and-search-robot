from tkinter.tix import Form

from fastapi import UploadFile, File, Depends

from backed_end.config.user_mannage import get_current_active_user
from backed_end.pojo.User import User
from backed_end.service.userservice import upload_service
from typing import List, Annotated, Optional
from fastapi import APIRouter

router = APIRouter()

@router.post("/", summary="上传文件")
async def upload_files(user: Annotated[User, Depends(get_current_active_user)],
                       chat_id: Optional[str] = Form(None),
                       files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        result = upload_service.upload_file_service(file,chat_id)
        results.append(result)

    return {
        "message": f"成功上传 {len(results)} 个文件",
        "files": results
    }