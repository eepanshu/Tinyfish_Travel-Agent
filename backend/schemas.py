from pydantic import BaseModel
from typing import List, Optional

class UserProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class TripRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    user_profile: Optional[UserProfile] = None

class AgentTask(BaseModel):
    id: int
    task: str
    url: str = "https://www.google.com"
    status: str = "pending"
    result: Optional[str] = None
    result_data: Optional[dict] = None

class TripPlan(BaseModel):
    id: Optional[str] = None
    tasks: List[AgentTask]
    itinerary: Optional[dict] = None
