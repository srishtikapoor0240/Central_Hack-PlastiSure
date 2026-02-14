import tensorflow as tf
import os

MODEL = None

def load_model_once():
    global MODEL
    if MODEL is None:
        BASE_DIR = os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )

        model_path = os.path.join(
            BASE_DIR,
            "models",
            "plastic_classifier",
            "weights",
            "model.h5"
        )

        print("Loading model from:", model_path)
        print("Exists?", os.path.exists(model_path))

        MODEL = tf.keras.models.load_model(model_path)
        print("Model output shape:", MODEL.output_shape)


def get_model():
    return MODEL
