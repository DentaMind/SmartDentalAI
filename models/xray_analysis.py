import json
import requests

class XRayAnalysis:
    def __init__(self, roboflow_api_key, patient_chart_data):
        self.roboflow_api_key = roboflow_api_key
        self.patient_chart_data = patient_chart_data
        self.feedback_file = 'feedback.json'
        self.roboflow_url = 'https://detect.roboflow.com/YOUR_MODEL/1?api_key=' + self.roboflow_api_key  # Replace with your model info

    def analyze_xray(self, xray_image_path):
        response = self.send_to_roboflow(xray_image_path)
        diagnosis, confidence = self.parse_roboflow_response(response)
        combined_data = self.combine_with_chart_data(diagnosis)
        return combined_data, confidence

    def send_to_roboflow(self, xray_image_path):
        try:
            with open(xray_image_path, 'rb') as image_file:
                response = requests.post(
                    self.roboflow_url,
                    files={'file': image_file}
                )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error uploading to Roboflow: {e}")
            return {}

    def parse_roboflow_response(self, response):
        try:
            predictions = response["predictions"]
            if not predictions:
                return "No findings", 0.0

            top_prediction = predictions[0]
            diagnosis = top_prediction.get("class", "Unknown")
            confidence = top_prediction.get("confidence", 0.0)
            return diagnosis, confidence

        except Exception as e:
            print(f"❌ Error parsing Roboflow response: {e}")
            return "Parsing error", 0.0

    def combine_with_chart_data(self, diagnosis):
        combined_data = {
            "diagnosis": diagnosis,
            "chart_data": self.patient_chart_data
        }
        return combined_data

    def update_feedback(self_
