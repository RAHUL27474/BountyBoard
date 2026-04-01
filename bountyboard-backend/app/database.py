import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", "/data/app.db")

def get_db_path():
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    return DB_PATH

def init_db():
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS bounties (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                reward_amount REAL NOT NULL,
                reward_token TEXT NOT NULL DEFAULT 'SOL',
                poster_wallet TEXT NOT NULL,
                claimer_wallet TEXT,
                status TEXT NOT NULL DEFAULT 'open',
                submission_text TEXT,
                submission_link TEXT,
                escrow_tx TEXT,
                payment_tx TEXT,
                deadline TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                claimed_at TEXT,
                submitted_at TEXT,
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS users (
                wallet_address TEXT PRIMARY KEY,
                display_name TEXT,
                bio TEXT,
                avatar_url TEXT,
                bounties_posted INTEGER NOT NULL DEFAULT 0,
                bounties_completed INTEGER NOT NULL DEFAULT 0,
                total_earned REAL NOT NULL DEFAULT 0.0,
                total_spent REAL NOT NULL DEFAULT 0.0,
                reputation_score REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

@contextmanager
def get_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
