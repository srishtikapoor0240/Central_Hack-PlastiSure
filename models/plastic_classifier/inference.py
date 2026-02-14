import numpy as np
from PIL import Image
from models.plastic_classifier.model import get_model

CLASS_LABELS = ['HDPE', 'LDPA', 'Other', 'PET', 'PP', 'PS', 'PVC']

def classify_image(image_path):
    model = get_model()

    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))

    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)

    predicted_index = np.argmax(prediction[0])
    plastic_type = CLASS_LABELS[predicted_index]

    return plastic_type
