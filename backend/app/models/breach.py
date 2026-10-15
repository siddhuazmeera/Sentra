from typing import List, Optional, Literal
from pydantic import BaseModel

class BreachRecord(BaseModel):
    id: str
    domainOrEmail: str
    breachName: str
    breachDate: str
    dataExposed: List[str]
    recommendedActions: List[str]
    status: Literal["active", "resolved"] = "active"
    pwnCount: Optional[int] = None

class BreachStatusUpdate(BaseModel):
    status: Literal["active", "resolved"]
