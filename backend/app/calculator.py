from fastapi import APIRouter, Depends
from app.auth import verify_token

router = APIRouter(prefix="/calc", tags=["Calculator"])

@router.get("/demo")
def demo(username: str = Depends(verify_token)):
    return {"message": f"Hello {username}, this is the calculator endpoint!"}
