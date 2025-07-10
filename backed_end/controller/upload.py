from fastapi import APIRouter, UploadFile, File
from backed_end.service.userservice import upload_service
from typing import List
from fastapi import APIRouter

router = APIRouter()





router = APIRouter()

@router.post("/", summary="上传文件")
async def upload_files(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        result = upload_service.upload_file_service(file)
        results.append(result)

    return {
        "message": f"成功上传 {len(results)} 个文件",
        "files": results
    }