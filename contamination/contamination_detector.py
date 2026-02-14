"""
import cv2
import numpy as np


def detect_contamination(image_path):
    
    Simple heuristic contamination detection.

    Returns:
        contamination_level (str)
        cleanliness_factor (float)
    

    image = cv2.imread(image_path)

    # Safety fallback
    if image is None:
        return "UNKNOWN", 0.5

    # Resize for consistent processing
    image = cv2.resize(image, (224, 224))

    # Convert to grayscale

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

# remove bright background pixels
    mask = gray < 230
    gray = gray[mask]


 

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

import cv2
import numpy as np


def detect_contamination(image_path):
    
    Heuristic contamination detection based on surface irregularity.

    Returns:
        contamination_level (str)
        cleanliness_factor (float)


    image = cv2.imread(image_path)

    # Safety fallback
    if image is None:
        return "UNKNOWN", 0.5

    # Resize for consistent processing
    image = cv2.resize(image, (224, 224))

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Normalize brightness to reduce lighting impact
    gray = cv2.equalizeHist(gray)

    # ---- EDGE DETECTION (MAIN CHANGE) ----
    edges = cv2.Canny(gray, 50, 150)

    # Edge density = amount of texture/irregularity
    edge_density = np.sum(edges > 0) / edges.size

    # ---- HEURISTIC DECISION ----
    # Clean plastic surfaces are smooth (low edge density)
    # Dirty surfaces create irregular edges

    if edge_density > 0.12:
        contamination_level = "HIGH"
        cleanliness_factor = 0.3

    elif edge_density > 0.06:
        contamination_level = "MEDIUM"
        cleanliness_factor = 0.6

    else:
        contamination_level = "LOW"
        cleanliness_factor = 0.9

    return contamination_level, cleanliness_factor

import cv2
import numpy as np


def detect_contamination(image_path):
    
    Heuristic contamination detection based on surface irregularity.

    Returns:
        contamination_level (str)
        cleanliness_factor (float)
    

    image = cv2.imread(image_path)

    # Safety fallback
    if image is None:
        return "UNKNOWN", 0.5

    # Resize for consistent processing
    image = cv2.resize(image, (224, 224))

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Normalize brightness to reduce lighting impact
    gray = cv2.equalizeHist(gray)

    # ---- EDGE DETECTION ----
    edges = cv2.Canny(gray, 50, 150)

    # Edge density = amount of texture/irregularity
    edge_density = np.sum(edges > 0) / edges.size

    # ---- CONTINUOUS CLEANLINESS SCORE ----
    # Higher edge density → lower cleanliness
    cleanliness_factor = max(0.2, 1 - edge_density * 4)

    # ---- CONTAMINATION LEVEL (LABEL ONLY) ----
    if edge_density > 0.12:
        contamination_level = "HIGH"
    elif edge_density > 0.06:
        contamination_level = "MEDIUM"
    else:
        contamination_level = "LOW"

    return contamination_level, round(cleanliness_factor, 2)
"""
import cv2
import numpy as np


def detect_contamination(image_path):
    """
    Heuristic contamination detection based on:
    - surface irregularity (edge density)
    - brightness level
    - color variation

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

    # Normalize brightness
    gray = cv2.equalizeHist(gray)

    # ---- EDGE DETECTION (Surface Irregularity) ----
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size

    # ---- BRIGHTNESS MEASURE ----
    mean_brightness = np.mean(gray)

    # ---- COLOR VARIATION ----
    color_variance = np.var(image)

    # ---- CONTINUOUS CLEANLINESS SCORE ----
    cleanliness_factor = max(0.2, 1 - edge_density * 4)

    # ---- CONTAMINATION TYPE DECISION ----
    # Burnt plastic: very dark + irregular
    if mean_brightness < 60 and edge_density > 0.10:
        contamination_level = "HIGH"

    # Muddy / removable contamination
    elif edge_density > 0.12 and color_variance > 500:
        contamination_level = "MEDIUM"

    # Normal contamination levels
    elif edge_density > 0.06:
        contamination_level = "MEDIUM"
    else:
        contamination_level = "LOW"

    return contamination_level, float(round(cleanliness_factor, 2))

