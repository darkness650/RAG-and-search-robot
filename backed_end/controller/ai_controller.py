from fastapi import APIRouter
from backed_end.pojo.question import question
from backed_end.service.aiservice.aiservice import service
router = APIRouter(prefix="/ai", tags=["ai"])
@router.post("")
async def ai(question: question):
    result = service(question.question,"1",True,True)
    return {"result": result}