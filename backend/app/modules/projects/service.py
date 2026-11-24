'''
This creates the main project record and automatically seeds an empty default record
'''
from sqlalchemy.orm import Session
from app.modules.projects.models import Project, ProjectStep, StepRevisionLog, StepMaterial
from app.modules.projects.schemas import (
    ProjectCreate,
    StepMaterialCreate,
    UpdatePlannedDateSchema,
    MarkStepDoneSchema,
)
from datetime import date
from fastapi import HTTPException

def create_project_with_steps(db: Session, project_in: ProjectCreate) -> Project:
    db_project = Project(
        name=project_in.name,
        project_date=project_in.project_date,
        category=project_in.category,
        categories=project_in.categories,
        plant=project_in.plant,
        plant_custom_name=project_in.plant_custom_name if project_in.plant == "Other" else None,
        owner=project_in.owner,
    )
    
    # Create all steps from payload
    for step_data in project_in.steps:
        if step_data.start_date is not None and step_data.start_date < project_in.project_date:
            raise HTTPException(status_code=422, detail="Step start date cannot be before the project date")
        if step_data.start_date is not None and step_data.planned_date is not None:
            if step_data.planned_date < step_data.start_date:
                raise HTTPException(status_code=422, detail="Step planned date cannot be before start date")
        db_step = ProjectStep(
            step_name=step_data.step_name,
            step_order=step_data.step_order,
            start_date=step_data.start_date,
            planned_date=step_data.planned_date,
            contact_email=step_data.contact_email or None,
            is_na=step_data.is_na,
        )

        if step_data.materials:
            for mat in step_data.materials:
                if mat.start_date is not None and mat.start_date < project_in.project_date:
                    raise HTTPException(status_code=422, detail="Material start date cannot be before the project date")
                if mat.start_date is not None and mat.planned_date is not None and mat.planned_date < mat.start_date:
                    raise HTTPException(status_code=422, detail="Material planned date cannot be before start date")
                db_material = StepMaterial(
                    material_name = mat.material_name,
                    start_date = mat.start_date,
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

def add_step_material(db: Session, step_id: int, payload: StepMaterialCreate):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if step.step_name != "Material Receiving Timeline" or step.is_na:
        raise HTTPException(status_code=400, detail="Materials can only be added to an active Material Receiving Timeline step")
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if payload.start_date is not None and project and payload.start_date < project.project_date:
        raise HTTPException(status_code=422, detail="Material start date cannot be before the project date")
    if payload.start_date is not None and payload.planned_date is not None and payload.planned_date < payload.start_date:
        raise HTTPException(status_code=422, detail="Material planned date cannot be before start date")

    material = StepMaterial(
        material_name=payload.material_name.strip(),
        start_date=payload.start_date,
        planned_date=payload.planned_date,
        is_completed=False,
    )
    step.materials.append(material)
    if payload.planned_date is not None and (step.planned_date is None or payload.planned_date > step.planned_date):
        step.planned_date = payload.planned_date
    if payload.start_date is not None and (step.start_date is None or payload.start_date < step.start_date):
        step.start_date = payload.start_date

    db.commit()
    db.refresh(material)
    return material

def update_step_planned_date(db: Session, step_id: int, payload: UpdatePlannedDateSchema):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    if "new_planned_date" in payload.model_fields_set:
        if payload.new_planned_date is not None:
            if payload.new_planned_date < step.project.project_date:
                raise HTTPException(status_code=422, detail="Planned date cannot be before the project date")
            effective_start = payload.new_start_date if "new_start_date" in payload.model_fields_set and payload.new_start_date is not None else step.start_date
            if effective_start is not None and payload.new_planned_date < effective_start:
                raise HTTPException(status_code=422, detail="Planned date cannot be before start date")
        if payload.new_planned_date != step.planned_date:
            if step.planned_date is not None and payload.new_planned_date is not None:
                if not payload.reason or not payload.reason.strip():
                    raise HTTPException(status_code=422, detail="A reason is required when changing an existing planned date")
                revision = StepRevisionLog(
                    step_id=step.id,
                    old_planned_date=step.planned_date,
                    new_planned_date=payload.new_planned_date,
                    reason=payload.reason.strip(),
                )
                db.add(revision)

            step.planned_date = payload.new_planned_date
            step.is_na = False

    if "new_start_date" in payload.model_fields_set:
        new_start_date = payload.new_start_date
        if new_start_date is not None:
            if new_start_date < step.project.project_date:
                raise HTTPException(status_code=422, detail="Start date cannot be before the project date")
            if step.planned_date is not None and step.planned_date < new_start_date:
                raise HTTPException(status_code=422, detail="Planned date cannot be before start date")
        step.start_date = new_start_date

    if "contact_email" in payload.model_fields_set:
        step.contact_email = (payload.contact_email or "").strip() or None

    db.commit()
    db.refresh(step)
    return step

def mark_step_as_done(db: Session, step_id: int, payload: MarkStepDoneSchema):
    step = db.query(ProjectStep).filter(ProjectStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if step.is_na:
        raise HTTPException(status_code=400, detail="An N/A step cannot be marked as done")

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