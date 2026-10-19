'''
This creates the main project record and automatically seeds an empty default record
'''
from sqlalchemy.orm import Session
from app.modules.projects.models import Project, ProjectStep, StepRevisionLog, StepMaterial
from app.modules.projects.schemas import ProjectCreate, UpdatePlannedDateSchema, MarkStepDoneSchema
from datetime import date
from fastapi import HTTPException

def create_project_with_steps(db: Session, project_in: ProjectCreate) -> Project:
    db_project = Project(
        name=project_in.name,
        project_date=project_in.project_date,
        category=project_in.category,
        plant=project_in.plant,
        plant_custom_name=project_in.plant_custom_name if project_in.plant == "Other" else None,
        owner=project_in.owner,
    )
    
    # Create all steps from payload
    for step_data in project_in.steps:
        db_step = ProjectStep(
            step_name=step_data.step_name,
            step_order=step_data.step_order,
            planned_date=step_data.planned_date,
        )

        if step_data.materials:
            for mat in step_data.materials:
                db_material = StepMaterial(
                    material_name = mat.material_name,
                    planned_date = mat.planned_date,
                    is_completed = False
                )

                db_step.materials.append(db_material)

        db_project.steps.append(db_step)

    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def mark_material_as_done(db: Session, material_id: int, payload: MarkStepDoneSchema):
    material = db.query(StepMaterial).filter(StepMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    material.is_completed = True
    material.actual_completion_date = date.today()
    material.completion_remark = payload.completion_remark

    db.commit()
    db.refresh(material)
    return material

def update_step_planned_date(db: Session, step_id: int, payload: UpdatePlannedDateSchema):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Create Revision Audit Log
    revision = StepRevisionLog(
        step_id=step.id,
        old_planned_date=step.planned_date,
        new_planned_date=payload.new_planned_date,
        reason=payload.reason
    )
    
    step.planned_date = payload.new_planned_date
    db.add(revision)
    db.commit()
    db.refresh(step)
    return step

def mark_step_as_done(db: Session, step_id: int, payload: MarkStepDoneSchema):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    step.is_completed = True
    step.actual_completion_date = date.today()
    step.completion_remark = payload.completion_remark
    
    db.commit()
    db.refresh(step)
    return step

def delete_project_step(db: Session, step_id: int):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    db.delete(step)
    db.commit()
    return True

def delete_project(db: Session, project_id: int):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    return True