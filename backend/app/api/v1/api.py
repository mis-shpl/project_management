from fastapi import APIRouter
from app.modules.projects.router import router as projects_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(projects_router)
