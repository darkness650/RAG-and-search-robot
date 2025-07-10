import os
import shutil
import mimetypes
from fastapi import UploadFile
from datetime import datetime

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'resource'))
LOG_FILE = os.path.join(UPLOAD_DIR, "upload_log.txt")


def get_unique_filename(filename: str, directory: str) -> str:
    base, ext = os.path.splitext(filename)
    counter = 1
    unique_name = filename

    while os.path.exists(os.path.join(directory, unique_name)):
        unique_name = f"{base}({counter}){ext}"
        counter += 1

    return unique_name

def upload_file_service(file: UploadFile,username:str):
    user_dir = os.path.join(UPLOAD_DIR, username)
    os.makedirs(user_dir, exist_ok=True)

    unique_filename = get_unique_filename(file.filename, user_dir)
    file_location = os.path.join(user_dir, unique_filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    mime_type, _ = mimetypes.guess_type(file_location)
    mime_type = mime_type or "application/octet-stream"

    # ✅ 写入上传日志
    with open(LOG_FILE, "a", encoding="utf-8") as log:
        log.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 用户 {username} 上传: {unique_filename}\n")

    return {
        "filename": unique_filename,
        "filepath": file_location,
        "content_type": mime_type,
        "size": os.path.getsize(file_location)
    }
