from flask import Flask, render_template
from flask_cors import CORS
from app.routes import register_routes
from database.db import init_db
from models.plastic_classifier.model import load_model_once


def create_app():
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static"
    )

    CORS(app)
    init_db()
    load_model_once()
    register_routes(app)

    @app.route("/")
    def home():
        return render_template("index.html")

    return app


app = create_app()

if __name__ == "__main__":
    print("Starting PlastiSure Backend...")
    app.run(host="0.0.0.0", port=5000, debug=False)
