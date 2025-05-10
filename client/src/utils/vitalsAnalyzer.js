const vitalsAnalyzer = (vitals) => {
  const alerts = [];

  if (vitals.heartRate < 60 || vitals.heartRate > 100) {
    alerts.push(`Heart rate is ${vitals.heartRate}, which is outside the normal range (60-100 bpm).`);
  }

  if (vitals.bloodPressure) {
    const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
    if (systolic < 90 || systolic > 140 || diastolic < 60 || diastolic > 90) {
      alerts.push(`Blood pressure is ${vitals.bloodPressure}, which is outside the normal range (90/60 - 140/90 mmHg).`);
    }
  }

  if (vitals.oxygenSaturation < 95) {
    alerts.push(`Oxygen saturation is ${vitals.oxygenSaturation}%, which is below the normal range (95-100%).`);
  }

  return alerts;
};

export default vitalsAnalyzer; 