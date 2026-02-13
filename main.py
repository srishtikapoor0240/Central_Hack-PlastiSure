from services.recyclability_service import evaluate_recyclability

input_data = {
    "plastic_type": "PET",
    "image_path": "test_images/muddy.jpg"
}

result = evaluate_recyclability(input_data)

print(result)
