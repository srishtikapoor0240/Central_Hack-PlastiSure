import base64
import os
from datetime import datetime
from database.db import get_next_block_number

PREFIX = "data:image/jpeg;base64,"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")


def validate_and_decode_image(image_string):
    if not image_string.startswith(PREFIX):
        raise ValueError("Invalid image prefix")

    encoded = image_string[len(PREFIX):]

    try:
        decoded = base64.b64decode(encoded)
    except Exception:
        raise ValueError("Invalid base64 encoding")

    if len(decoded) > 50 * 1024:
        raise ValueError("Image exceeds 50KB limit")

    return decoded


def save_image(image_bytes):
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    block_number = get_next_block_number()

    filename = f"{timestamp}_{block_number}.jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)

    with open(path, "wb") as f:
        f.write(image_bytes)

    return path
