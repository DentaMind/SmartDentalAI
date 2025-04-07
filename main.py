from roboflow import Roboflow

# ✅ Enter your real API Key here (from Roboflow settings)
API_KEY = "F0nX36tED9xYLBKCvTNz"

# ✅ Roboflow project info
WORKSPACE = "dentamind"
PROJECT = "dentamind"
VERSION = 1
TEST_IMAGE = "FMX_FADYA.jpg"

print("🔁 Connecting to Roboflow...")
rf = Roboflow(api_key=API_KEY)
project = rf.workspace(WORKSPACE).project(PROJECT)
model = project.version(VERSION).model

if model is None:
    print("❌ ERROR: Model not found. Check workspace/project/version.")
    exit()

print("✅ Model loaded.")

print(f"🖼️ Predicting on image: {TEST_IMAGE} ...")
result = model.predict(TEST_IMAGE).json()

print("📊 Result:")
print(result)
