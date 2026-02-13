import cv2
import numpy as np


def detect_contamination(image_path):
    """
    Simple heuristic contamination detection.

    Returns:
        contamination_level (str)
        cleanliness_factor (float)
    """

    image = cv2.imread(image_path)

    # Safety fallback
    if image is None:
        return "UNKNOWN", 0.5

    # Resize for consistent processing
    image = cv2.resize(image, (224, 224))

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ---- DARK PIXEL ANALYSIS ----
    dark_pixels = np.sum(gray < 50)
    total_pixels = gray.size
    dark_ratio = dark_pixels / total_pixels

    # ---- TEXTURE / VARIANCE ANALYSIS ----
    variance = np.var(gray)

    # ---- HEURISTIC DECISION ----
    if dark_ratio > 0.25 or variance > 1200:
        contamination_level = "HIGH"
        cleanliness_factor = 0.3

    elif dark_ratio > 0.1 or variance > 700:
        contamination_level = "MEDIUM"
        cleanliness_factor = 0.6

    else:
        contamination_level = "LOW"
        cleanliness_factor = 0.9

    return contamination_level, cleanliness_factor
