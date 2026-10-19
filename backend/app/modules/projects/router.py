from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.modules.projects.schemas import (
    ProjectCreate, ProjectResponse, ProjectStepResponse, 
    UpdatePlannedDateSchema, MarkStepDoneSchema, StepMaterialResponse
)
from app.modules.projects import service

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(service.Project).all()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    return service.create_project_with_steps(db=db, project_in=project_in)

@router.patch("/steps/{step_id}/planned-date", response_model=ProjectStepResponse)
def update_planned_date(step_id: int, payload: UpdatePlannedDateSchema, db: Session = Depends(get_db)):
    return service.update_step_planned_date(db=db, step_id=step_id, payload=payload)

@router.patch("/steps/{step_id}/mark-done", response_model=ProjectStepResponse)
def mark_done(step_id: int, payload: MarkStepDoneSchema, db: Session = Depends(get_db)):
    return service.mark_step_as_done(db=db, step_id=step_id, payload=payload)

@router.patch("/materials/{material_id}/mark-done", response_model=StepMaterialResponse)
def mark_material_done(material_id: int, payload: MarkStepDoneSchema, db: Session = Depends(get_db)):
    return service.mark_material_as_done(db=db, material_id=material_id, payload=payload)

@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(step_id: int, db: Session = Depends(get_db)):
    service.delete_project_step(db=db, step_id=step_id)
    return None

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    service.delete_project(db=db, project_id=project_id)
    return None