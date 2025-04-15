from flask import Flask, render_template

app = Flask(__name__)

# ========== DISABLED ROBOFLOW FOR NOW ==========
# from roboflow import Roboflow
# rf = Roboflow(api_key="your-api-key")
# project = rf.workspace().project()
# model = project.version().model
# ==============================================

@app.route("/")
def home():
    return render_template("index.html")  # or whatever your main file is

if __name__ == "__main__":
    app.run(debug=True)
