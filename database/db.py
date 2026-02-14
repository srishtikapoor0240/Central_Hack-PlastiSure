import sqlite3

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "plasti_sure.db")


def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            block_number INTEGER,
            timestamp TEXT,
            plastic_type TEXT,
            contamination TEXT,
            cleanliness_factor REAL,
            recyclability_score REAL,
            recommendation TEXT,
            previous_hash TEXT,
            current_hash TEXT
        )
    """)

    conn.commit()
    conn.close()

def get_next_block_number():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(block_number) FROM blocks")
    result = cursor.fetchone()[0]
    conn.close()
    return 1 if result is None else result + 1
