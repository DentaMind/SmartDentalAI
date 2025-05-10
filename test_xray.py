from models.xray_analysis import XRayAnalysis
from models.diagnosis_engine import DiagnosisEngine
from models.treatment_report import TreatmentReport
import requests
import base64
from PIL import Image
from io import BytesIO

# Set your Roboflow API key here (use a real one from your environment or testing key)
roboflow_api_key ='F0nX36tED9xYLBKCvTNz'

# Simulated chart data
patient_chart_data = {
    "patient_id": 101,
    "name": "Jane Doe",
    "age": 37,
    "missing_teeth": 3,
    "probing_depths": [3, 4, 5, 4, 3, 5]
}

# Path to your X-ray
xray_image_path = "attached_assets/sample-xrays/test-xray.jpg"

def image_to_base64(image):
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

# Load and process the dental X-ray
image = Image.open("lower_anteriors.png")
image = image.convert('RGB')  # Convert to RGB mode

# Convert to base64
base64_string = image_to_base64(image)

# Send to API
response = requests.post(
    "http://127.0.0.1:8001/image/upload",
    json={"image_base64": base64_string}
)

print("\nAPI Response:")
print("Status Code:", response.status_code)
print("\nAnalysis Results:")
if response.status_code == 200:
    result = response.json()
    print("Diagnosis:", result.get("diagnosis"))
    print("Confidence:", result.get("confidence"))
else:
    print("Error:", response.json())

try:
    # Run X-ray analysis
    print("\n🔍 Running X-ray AI analysis...")
    xray_ai = XRayAnalysis(roboflow_api_key, patient_chart_data)
    combined_data, confidence = xray_ai.analyze_xray(xray_image_path)

    # Generate diagnosis + treatment
    engine = DiagnosisEngine(combined_data, patient_chart_data)
    engine.generate_diagnosis()

    # Output results
    print("\n✅ Combined Data:")
    print(combined_data)

    print("\n🧠 Diagnosis:")
    for d in engine.diagnosis:
        print("-", d)

    print("\n🦷 Treatment Plan:")
    report = TreatmentReport(engine.diagnosis, engine.treatment_plan)
    print(report.render_report())

    # Optional: Send feedback
    xray_ai.update_feedback(xray_image_path, correct=True, reason="Correct prediction")

except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
