from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uuid
from datetime import datetime, timezone

from app.database import init_db, get_connection
from app.models import (
    CreateBountyRequest, ClaimBountyRequest, SubmitWorkRequest,
    ApproveWorkRequest, DisputeBountyRequest, UpdateUserRequest,
    BountyResponse, UserResponse, StatsResponse, BountyStatus
)

app = FastAPI(title="BountyBoard API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


def _ensure_user(conn, wallet: str):
    """Create user record if it doesn't exist."""
    now = datetime.now(timezone.utc).isoformat()
    existing = conn.execute(
        "SELECT wallet_address FROM users WHERE wallet_address = ?", (wallet,)
    ).fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO users (wallet_address, created_at, updated_at) VALUES (?, ?, ?)",
            (wallet, now, now)
        )


def _row_to_bounty(row) -> dict:
    return dict(row)


# ─── Bounty Endpoints ───

@app.post("/bounties", response_model=BountyResponse)
async def create_bounty(req: CreateBountyRequest):
    bounty_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        _ensure_user(conn, req.poster_wallet)
        conn.execute(
            """INSERT INTO bounties
            (id, title, description, category, reward_amount, reward_token,
             poster_wallet, escrow_tx, deadline, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (bounty_id, req.title, req.description, req.category.value,
             req.reward_amount, req.reward_token, req.poster_wallet,
             req.escrow_tx, req.deadline, BountyStatus.OPEN.value, now, now)
        )
        conn.execute(
            "UPDATE users SET bounties_posted = bounties_posted + 1, total_spent = total_spent + ?, updated_at = ? WHERE wallet_address = ?",
            (req.reward_amount, now, req.poster_wallet)
        )
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


@app.get("/bounties", response_model=list[BountyResponse])
async def list_bounties(
    status: Optional[str] = None,
    category: Optional[str] = None,
    poster: Optional[str] = None,
    claimer: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query(default="created_at", pattern="^(created_at|reward_amount|deadline)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = "SELECT * FROM bounties WHERE 1=1"
    params: list = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if category:
        query += " AND category = ?"
        params.append(category)
    if poster:
        query += " AND poster_wallet = ?"
        params.append(poster)
    if claimer:
        query += " AND claimer_wallet = ?"
        params.append(claimer)
    if search:
        query += " AND (title LIKE ? OR description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += f" ORDER BY {sort_by} {sort_order} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return [BountyResponse(**dict(r)) for r in rows]


@app.get("/bounties/{bounty_id}", response_model=BountyResponse)
async def get_bounty(bounty_id: str):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Bounty not found")
    return BountyResponse(**dict(row))


@app.put("/bounties/{bounty_id}/claim", response_model=BountyResponse)
async def claim_bounty(bounty_id: str, req: ClaimBountyRequest):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bounty not found")

        bounty = dict(row)
        if bounty["status"] != BountyStatus.OPEN.value:
            raise HTTPException(status_code=400, detail="Bounty is not open for claiming")
        if bounty["poster_wallet"] == req.claimer_wallet:
            raise HTTPException(status_code=400, detail="Cannot claim your own bounty")

        _ensure_user(conn, req.claimer_wallet)
        conn.execute(
            "UPDATE bounties SET claimer_wallet = ?, status = ?, claimed_at = ?, updated_at = ? WHERE id = ?",
            (req.claimer_wallet, BountyStatus.CLAIMED.value, now, now, bounty_id)
        )
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


@app.put("/bounties/{bounty_id}/submit", response_model=BountyResponse)
async def submit_work(bounty_id: str, req: SubmitWorkRequest):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bounty not found")

        bounty = dict(row)
        if bounty["status"] != BountyStatus.CLAIMED.value:
            raise HTTPException(status_code=400, detail="Bounty is not in claimed status")
        if bounty["claimer_wallet"] != req.claimer_wallet:
            raise HTTPException(status_code=403, detail="Only the claimer can submit work")
        if not req.submission_text and not req.submission_link:
            raise HTTPException(status_code=400, detail="Must provide submission text or link")

        conn.execute(
            "UPDATE bounties SET submission_text = ?, submission_link = ?, status = ?, submitted_at = ?, updated_at = ? WHERE id = ?",
            (req.submission_text, req.submission_link, BountyStatus.SUBMITTED.value, now, now, bounty_id)
        )
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


@app.put("/bounties/{bounty_id}/approve", response_model=BountyResponse)
async def approve_work(bounty_id: str, req: ApproveWorkRequest):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bounty not found")

        bounty = dict(row)
        if bounty["status"] != BountyStatus.SUBMITTED.value:
            raise HTTPException(status_code=400, detail="Bounty is not in submitted status")
        if bounty["poster_wallet"] != req.poster_wallet:
            raise HTTPException(status_code=403, detail="Only the poster can approve work")

        conn.execute(
            "UPDATE bounties SET payment_tx = ?, status = ?, completed_at = ?, updated_at = ? WHERE id = ?",
            (req.payment_tx, BountyStatus.COMPLETED.value, now, now, bounty_id)
        )

        claimer = bounty["claimer_wallet"]
        reward = bounty["reward_amount"]
        conn.execute(
            "UPDATE users SET bounties_completed = bounties_completed + 1, total_earned = total_earned + ?, reputation_score = reputation_score + 1, updated_at = ? WHERE wallet_address = ?",
            (reward, now, claimer)
        )

        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


@app.put("/bounties/{bounty_id}/dispute", response_model=BountyResponse)
async def dispute_bounty(bounty_id: str, req: DisputeBountyRequest):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bounty not found")

        bounty = dict(row)
        if bounty["status"] not in [BountyStatus.SUBMITTED.value, BountyStatus.CLAIMED.value]:
            raise HTTPException(status_code=400, detail="Cannot dispute this bounty")
        if req.wallet not in [bounty["poster_wallet"], bounty["claimer_wallet"]]:
            raise HTTPException(status_code=403, detail="Only poster or claimer can dispute")

        conn.execute(
            "UPDATE bounties SET status = ?, updated_at = ? WHERE id = ?",
            (BountyStatus.DISPUTED.value, now, bounty_id)
        )
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


@app.put("/bounties/{bounty_id}/cancel", response_model=BountyResponse)
async def cancel_bounty(bounty_id: str, poster_wallet: str):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bounty not found")

        bounty = dict(row)
        if bounty["poster_wallet"] != poster_wallet:
            raise HTTPException(status_code=403, detail="Only the poster can cancel")
        if bounty["status"] not in [BountyStatus.OPEN.value]:
            raise HTTPException(status_code=400, detail="Can only cancel open bounties")

        conn.execute(
            "UPDATE bounties SET status = ?, updated_at = ? WHERE id = ?",
            (BountyStatus.CANCELLED.value, now, bounty_id)
        )

        conn.execute(
            "UPDATE users SET total_spent = total_spent - ?, updated_at = ? WHERE wallet_address = ?",
            (bounty["reward_amount"], now, poster_wallet)
        )

        row = conn.execute("SELECT * FROM bounties WHERE id = ?", (bounty_id,)).fetchone()

    return BountyResponse(**dict(row))


# ─── User Endpoints ───

@app.get("/users/{wallet}", response_model=UserResponse)
async def get_user(wallet: str):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE wallet_address = ?", (wallet,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**dict(row))


@app.put("/users/{wallet}", response_model=UserResponse)
async def update_user(wallet: str, req: UpdateUserRequest):
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        _ensure_user(conn, wallet)

        updates = []
        params = []
        if req.display_name is not None:
            updates.append("display_name = ?")
            params.append(req.display_name)
        if req.bio is not None:
            updates.append("bio = ?")
            params.append(req.bio)
        if req.avatar_url is not None:
            updates.append("avatar_url = ?")
            params.append(req.avatar_url)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(wallet)
            conn.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE wallet_address = ?",
                params
            )

        row = conn.execute("SELECT * FROM users WHERE wallet_address = ?", (wallet,)).fetchone()

    return UserResponse(**dict(row))


# ─── Stats Endpoint ───

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM bounties").fetchone()[0]
        open_count = conn.execute("SELECT COUNT(*) FROM bounties WHERE status = 'open'").fetchone()[0]
        completed = conn.execute("SELECT COUNT(*) FROM bounties WHERE status = 'completed'").fetchone()[0]
        tvl = conn.execute("SELECT COALESCE(SUM(reward_amount), 0) FROM bounties WHERE status IN ('open', 'claimed', 'submitted')").fetchone()[0]
        paid = conn.execute("SELECT COALESCE(SUM(reward_amount), 0) FROM bounties WHERE status = 'completed'").fetchone()[0]
        posters = conn.execute("SELECT COUNT(DISTINCT poster_wallet) FROM bounties").fetchone()[0]
        claimers = conn.execute("SELECT COUNT(DISTINCT claimer_wallet) FROM bounties WHERE claimer_wallet IS NOT NULL").fetchone()[0]

    return StatsResponse(
        total_bounties=total,
        open_bounties=open_count,
        completed_bounties=completed,
        total_value_locked=tvl,
        total_paid_out=paid,
        unique_posters=posters,
        unique_claimers=claimers,
    )
