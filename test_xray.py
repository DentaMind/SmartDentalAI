from models.xray_analysis import XRayAnalysis
from models.diagnosis_engine import DiagnosisEngine
from models.treatment_report import TreatmentReport

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
