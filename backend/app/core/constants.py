from enum import Enum

class PlantType(str, Enum):
    HO = "HO"
    FACTORY = "Factory"
    OTHER = "Other"