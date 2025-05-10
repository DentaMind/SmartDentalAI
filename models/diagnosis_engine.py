# models/diagnosis_engine.py

class DiagnosisEngine:
    def __init__(self, xray_findings, chart_data):
        self.xray_findings = xray_findings
        self.chart_data = chart_data
        self.diagnosis = []
        self.treatment_plan = []

    def generate_diagnosis(self):
        # Example logic — this should evolve with more conditions
        for tooth in self.xray_findings:
            if tooth["condition"] == "caries" and tooth["confidence"] > 0.6:
                self.diagnosis.append(f"Caries detected on tooth {tooth['tooth_number']}")
                self.treatment_plan.append({
                    "tooth": tooth["tooth_number"],
                    "reason": "High confidence caries detection",
                    "recommendation": "Composite restoration"
                })

            elif tooth["condition"] == "bone_loss" and tooth["confidence"] > 0.6:
                self.diagnosis.append(f"Bone loss detected on tooth {tooth['tooth_number']}")
                self.treatment_plan.append({
                    "tooth": tooth["tooth_number"],
                    "reason": "High confidence bone loss with radiographic evidence",
                    "recommendation": "Scaling and Root Planing (SRP) with re-eval"
                })

            elif tooth["condition"] == "root_canal_treated" and self.chart_data.get("pain", False):
                self.diagnosis.append(f"Possible failure of RCT on tooth {tooth['tooth_number']}")
                self.treatment_plan.append({
                    "tooth": tooth["tooth_number"],
                    "reason": "RCT observed but patient has pain",
                    "recommendation": "CBCT evaluation and referral to endodontist"
                })

        return self.diagnosis

    def get_treatment_plan(self):
        return self.treatment_plan
