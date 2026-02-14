from flask import request, jsonify
from utils.image_utils import validate_and_decode_image, save_image
from models.plastic_classifier.inference import classify_image
from services.recyclability_service import evaluate_recyclability
from services.blockchain_service import create_block, verify_chain_integrity

def register_routes(app):
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200


    @app.route("/analyze", methods=["POST"])
    def analyze():
        try:
            if not request.is_json:
                return jsonify({"error": "Invalid JSON"}), 400

            data = request.get_json()
            if "image" not in data:
                return jsonify({"error": "Missing image field"}), 400

            image_bytes = validate_and_decode_image(data["image"])
            saved_path = save_image(image_bytes)

            plastic_type = classify_image(saved_path)

            service_result = evaluate_recyclability({
                "plastic_type": plastic_type,
                "image_path": saved_path
            })

            block = create_block(service_result)
            display_label=service_result["plastic_type"]
            if display_label=="LDPA":
                display_label="LDPE"
            print("DEBUG SCORE:", service_result["recyclability_score"])

            return jsonify({
                "plastic_type": display_label,
                "contamination": service_result["contamination"],
                "cleanliness_factor": service_result["cleanliness_factor"],
                "recyclability_score": service_result["recyclability_score"],
                "score_breakdown": service_result["score_breakdown"],
                "recommendation": service_result["recommendation"],
                "block_number": block["block_number"],
                "hash": block["current_hash"]
            })

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Internal Server Error"}), 500

    @app.route("/verify-chain", methods=["GET"])
    def verify_chain():
        result = verify_chain_integrity()
        return jsonify(result)
    
