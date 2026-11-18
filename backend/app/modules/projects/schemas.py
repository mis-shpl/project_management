from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date, datetime
from app.core.constants import PlantType

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, example="New Automation Line")
    project_date: date
    category: str
    plant: str
    plant_custom_name: Optional[str] = None
    owner: str
    steps: List[InitialStepCreate]

# Response model returning the created project with initialized work details
class ProjectResponse(BaseModel):
    id: int
    name: str
    project_date: date
    category: str
    plant: str
    plant_custom_name: Optional[str] = None
    owner: str
    created_at: datetime
    steps: List[ProjectStepResponse] = []

    class Config:
        from_attributes = True

class UpdatePlannedDateSchema(BaseModel):
    new_planned_date: Optional[date] = None
    reason: Optional[str] = None
    contact_email: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set.intersection({"new_planned_date", "contact_email"}):
            raise ValueError("Provide a planned date or contact email to update")
        return self

    
class StepMaterialCreate(BaseModel):
    material_name: str
    planned_date: date

    @field_validator("material_name")
    @classmethod
    def validate_material_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Material name cannot be empty")
        return value

class StepMaterialResponse(BaseModel):
    id: int
    material_name: str
    planned_date: date
    actual_completion_date: Optional[date] = None
    is_completed: bool
    completion_remark: Optional[str] = None

    class Config:
        from_attributes = True

class StepRevisionLogResponse(BaseModel):
    id: int
    old_planned_date: Optional[date] = None
    new_planned_date: date
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

class InitialStepCreate(BaseModel):
    step_name: str
    step_order: int
    planned_date: Optional[date] = None
    contact_email: Optional[str] = None
    is_na: bool = False
    materials: Optional[List[StepMaterialCreate]] = []

    @model_validator(mode="after")
    def validate_schedule(self):
        if self.is_na and self.planned_date is not None:
            raise ValueError("An N/A step cannot have a planned date")
        if self.is_na and self.materials:
            raise ValueError("An N/A step cannot have materials")
        return self

class ProjectStepResponse(BaseModel):
    id: int
    step_name: str
    step_order: int
    planned_date: Optional[date] = None
    contact_email: Optional[str] = None
    is_na: bool = False
    actual_completion_date: Optional[date] = None
    is_completed: bool
    completion_remark: Optional[str] = None
    revisions: List[StepRevisionLogResponse] = []
    materials: List[StepMaterialResponse] = []

    class Config:
        from_attributes = True

class MarkStepDoneSchema(BaseModel):
    completion_remark: Optional[str] = None

# Schema for work details tracking output
class ProjectWorkDetailResponse(BaseModel):
    tech_discussion_user: Optional[str] = None
    tech_discussion_vendor: Optional[str] = None
    drawing_status: Optional[str] = None
    drawing_timeline: Optional[date] = None
    boq_status: Optional[str] = None
    boq_timeline: Optional[date] = None
    project_approval: Optional[str] = None
    indent_creation: Optional[str] = None
    po_status_material_po: Optional[str] = None
    po_status_service_po: Optional[str] = None
    material_receiving_timeline: Optional[date] = None
    purchase_remark: Optional[str] = None
    user_clearance: Optional[str] = None
    project_timeline: Optional[date] = None
    project_start: Optional[date] = None
    project_complete: Optional[date] = None
    handover_to_user: Optional[date] = None
    remark: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectWorkDetailUpdate(BaseModel):
    tech_discussion_user: Optional[str] = None
    tech_discussion_vendor: Optional[str] = None
    drawing_status: Optional[str] = None
    drawing_timeline: Optional[date] = None
    boq_status: Optional[str] = None
    boq_timeline: Optional[date] = None
    project_approval: Optional[str] = None
    indent_creation: Optional[str] = None
    po_status_material_po: Optional[str] = None
    po_status_service_po: Optional[str] = None
    material_receiving_timeline: Optional[date] = None
    purchase_remark: Optional[str] = None
    user_clearance: Optional[str] = None
    project_timeline: Optional[date] = None
    project_start: Optional[date] = None
    project_complete: Optional[date] = None
    handover_to_user: Optional[date] = None
    remark: Optional[str] = None