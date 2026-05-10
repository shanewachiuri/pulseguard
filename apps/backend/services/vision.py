import os

class VisionService:
    def __init__(self):
        # We are bypassing Roboflow initialization until your credits reset!
        # This prevents the 403 Forbidden and Credit Limit errors.
        self.model = None
        print("✅ Vision Service loaded in SIMULATION mode.")

    def analyze_damage(self, image_path: str) -> dict:
        """
        Simulates a Roboflow inference response to bypass API credit limits.
        """
        # We return a highly confident, simulated "Maize Rust" detection 
        # so you can successfully build and test your Next.js frontend!
        return {
            "is_damaged": True,
            "confidence": 0.92,
            "details": [
                {
                    "class": "Maize Rust",
                    "confidence": 0.92
                }
            ]
        }