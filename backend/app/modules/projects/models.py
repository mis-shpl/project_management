from datetime import datetime
from sqlalchemy import Column, Boolean, Integer, String, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_date = Column(Date, nullable=False)
    category = Column(String(100), nullable=False)  # Department
    plant = Column(String(50), nullable=False)       # HO, Factory, Other
    plant_custom_name = Column(String(100), nullable=True)  # Filled if plant == 'Other'
    owner = Column(String(150), nullable=False)      # Project Owner
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 1-to-1 relationship with Steps
    steps = relationship("ProjectStep", back_populates="project", cascade="all, delete-orphan", order_by="ProjectStep.step_order")

class ProjectStep(Base):
    __tablename__ = "project_steps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    step_name = Column(String, nullable=False)
    step_order = Column(Integer, nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_completion_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    completion_remark = Column(String, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="steps")
    revisions = relationship("StepRevisionLog", back_populates="step", cascade="all, delete-orphan", order_by="StepRevisionLog.created_at.desc()")
    materials = relationship("StepMaterial", back_populates="step", cascade="all, delete-orphan", order_by="StepMaterial.id")

class StepMaterial(Base):
    __tablename__ = "step_materials"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("project_steps.id", ondelete="CASCADE"), nullable=False)
    material_name = Column(String, nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_completion_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=True)
    completion_remark = Column(String, nullable=True)

    step = relationship("ProjectStep", back_populates="materials")

class StepRevisionLog(Base):
    __tablename__ = "step_revision_log"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("project_steps.id", ondelete="CASCADE"), nullable=False)
    old_planned_date = Column(Date, nullable=False)
    new_planned_date = Column(Date, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    step = relationship("ProjectStep", back_populates="revisions")