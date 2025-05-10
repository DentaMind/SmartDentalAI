# models/treatment_report.py

class TreatmentReport:
    def __init__(self, diagnosis_list, treatment_plan_list):
        self.diagnoses = diagnosis_list
        self.treatments = treatment_plan_list

    def generate_report(self):
        print("\n🦷 AI Diagnosis Report")
        print("-" * 30)
        for item in self.diagnoses:
            print(f"Tooth {item['tooth']}:")
            print(f"  ➤ Diagnosis: {item['reason']}")
        print("\n🛠️ Recommended Treatments")
        print("-" * 30)
        for tx in self.treatments:
            print(f"Tooth {tx['tooth']}:")
            print(f"  ➤ Reason: {tx['reason']}")
            print(f"  ➤ Recommendation: {tx['recommendation']}")
        print("\n✅ AI-generated report complete.")
