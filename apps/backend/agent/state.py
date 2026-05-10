from typing import TypedDict

class PulseState(TypedDict):
    user_id: str
    input_data: str
    risk_score: int
    assessment: str
    recommended_action: str