from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class BountyStatus(str, Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    SUBMITTED = "submitted"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class BountyCategory(str, Enum):
    DEVELOPMENT = "development"
    DESIGN = "design"
    WRITING = "writing"
    TRANSLATION = "translation"
    MARKETING = "marketing"
    RESEARCH = "research"
    GENERAL = "general"


class CreateBountyRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: BountyCategory = BountyCategory.GENERAL
    reward_amount: float = Field(..., gt=0)
    reward_token: str = "SOL"
    poster_wallet: str = Field(..., min_length=32)
    escrow_tx: Optional[str] = None
    deadline: Optional[str] = None


class ClaimBountyRequest(BaseModel):
    claimer_wallet: str = Field(..., min_length=32)


class SubmitWorkRequest(BaseModel):
    claimer_wallet: str = Field(..., min_length=32)
    submission_text: Optional[str] = None
    submission_link: Optional[str] = None


class ApproveWorkRequest(BaseModel):
    poster_wallet: str = Field(..., min_length=32)
    payment_tx: Optional[str] = None


class DisputeBountyRequest(BaseModel):
    wallet: str = Field(..., min_length=32)
    reason: Optional[str] = None


class UpdateUserRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None


class BountyResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    reward_amount: float
    reward_token: str
    poster_wallet: str
    claimer_wallet: Optional[str] = None
    status: str
    submission_text: Optional[str] = None
    submission_link: Optional[str] = None
    escrow_tx: Optional[str] = None
    payment_tx: Optional[str] = None
    deadline: Optional[str] = None
    created_at: str
    updated_at: str
    claimed_at: Optional[str] = None
    submitted_at: Optional[str] = None
    completed_at: Optional[str] = None


class UserResponse(BaseModel):
    wallet_address: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    bounties_posted: int = 0
    bounties_completed: int = 0
    total_earned: float = 0.0
    total_spent: float = 0.0
    reputation_score: float = 0.0
    created_at: str
    updated_at: str


class StatsResponse(BaseModel):
    total_bounties: int
    open_bounties: int
    completed_bounties: int
    total_value_locked: float
    total_paid_out: float
    unique_posters: int
    unique_claimers: int
