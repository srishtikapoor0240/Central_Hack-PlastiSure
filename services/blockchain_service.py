import json
import hashlib
from datetime import datetime
from database.db import get_connection

def create_block(service_result):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT block_number, current_hash FROM blocks ORDER BY block_number DESC LIMIT 1")
    last_block = cursor.fetchone()

    if last_block:
        block_number = last_block[0] + 1
        previous_hash = last_block[1]
    else:
        block_number = 1
        previous_hash = "0000"

    timestamp = datetime.utcnow().isoformat()

    block_data = {
        "block_number": block_number,
        "timestamp": timestamp,
        "plastic_type": service_result["plastic_type"],
        "contamination": service_result["contamination"],
        "cleanliness_factor": service_result["cleanliness_factor"],
        "recyclability_score": service_result["recyclability_score"],
        "recommendation": service_result["recommendation"],
        "previous_hash": previous_hash
    }

    data_string = json.dumps(block_data, sort_keys=True)
    current_hash = hashlib.sha256(
        (data_string + previous_hash).encode("utf-8")
    ).hexdigest()

    cursor.execute("""
        INSERT INTO blocks (
            block_number, timestamp, plastic_type,
            contamination, cleanliness_factor,
            recyclability_score, recommendation,
            previous_hash, current_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        block_number,
        timestamp,
        block_data["plastic_type"],
        block_data["contamination"],
        block_data["cleanliness_factor"],
        block_data["recyclability_score"],
        block_data["recommendation"],
        previous_hash,
        current_hash
    ))

    conn.commit()
    conn.close()

    block_data["current_hash"] = current_hash
    return block_data

def verify_chain_integrity():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT block_number, timestamp, plastic_type, contamination, cleanliness_factor, recyclability_score, recommendation, previous_hash, current_hash FROM blocks ORDER BY block_number ASC")
    rows = cursor.fetchall()
    conn.close()

    previous_hash = "0000"

    for row in rows:
        block_number, timestamp, plastic_type, contamination, cleanliness_factor, recyclability_score, recommendation, stored_prev_hash, stored_hash = row

        if stored_prev_hash != previous_hash:
            return {"status": "Corrupted", "block_number": block_number}

        block_data = {
            "block_number": block_number,
            "timestamp": timestamp,
            "plastic_type": plastic_type,
            "contamination": contamination,
            "cleanliness_factor": cleanliness_factor,
            "recyclability_score": recyclability_score,
            "recommendation": recommendation,
            "previous_hash": stored_prev_hash
        }

        data_string = json.dumps(block_data, sort_keys=True)
        recalculated_hash = hashlib.sha256(
            (data_string + stored_prev_hash).encode("utf-8")
        ).hexdigest()

        if recalculated_hash != stored_hash:
            return {"status": "Corrupted", "block_number": block_number}

        previous_hash = stored_hash

    return {"status": "Chain Valid"}
