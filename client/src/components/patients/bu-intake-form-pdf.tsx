import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { PatientIntakeFormData } from "@/shared/schema";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf" },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.ttf", fontWeight: "bold" },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "40%",
    fontSize: 12,
    fontWeight: "bold",
  },
  value: {
    width: "60%",
    fontSize: 12,
  },
  checkbox: {
    fontSize: 12,
    marginRight: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
});

interface BUIntakeFormPDFProps {
  patientName: string;
  formData: PatientIntakeFormData;
}

export function BUIntakeFormPDF({ patientName, formData }: BUIntakeFormPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Boston University Dental Intake Form</Text>
          <Text style={styles.subtitle}>Patient: {patientName}</Text>
          <Text style={styles.subtitle}>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Patient Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {formData.patientInfo.firstName} {formData.patientInfo.middleName} {formData.patientInfo.lastName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{formData.patientInfo.age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{formData.patientInfo.gender}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{formData.patientInfo.dateOfBirth}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{formData.patientInfo.phoneNumber}</Text>
          </View>
        </View>

        {/* General Medical Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Medical History</Text>
          {Object.entries(formData.generalMedical).map(([key, value]) => {
            if (typeof value === "boolean") {
              return (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{key.replace("has", "").replace(/([A-Z])/g, " $1").trim()}:</Text>
                  <Text style={styles.value}>{value ? "Yes" : "No"}</Text>
                </View>
              );
            }
            return null;
          })}
          {formData.generalMedical.medications && (
            <View style={styles.row}>
              <Text style={styles.label}>Medications:</Text>
              <Text style={styles.value}>{formData.generalMedical.medications}</Text>
            </View>
          )}
          {formData.generalMedical.allergies && (
            <View style={styles.row}>
              <Text style={styles.label}>Allergies:</Text>
              <Text style={styles.value}>{formData.generalMedical.allergies}</Text>
            </View>
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms (Past 6 Months)</Text>
          {Object.entries(formData.symptoms).map(([key, value]) => {
            if (typeof value === "boolean") {
              return (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{key.replace("has", "").replace(/([A-Z])/g, " $1").trim()}:</Text>
                  <Text style={styles.value}>{value ? "Yes" : "No"}</Text>
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Medical Conditions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Conditions</Text>
          {Object.entries(formData.medicalConditions).map(([category, conditions]) => (
            <View key={category}>
              <Text style={styles.label}>{category}:</Text>
              <Text style={styles.value}>{conditions.join(", ")}</Text>
            </View>
          ))}
        </View>

        {/* Social History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social History</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tobacco Use:</Text>
            <Text style={styles.value}>{formData.socialHistory.tobaccoUse.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Alcohol Use:</Text>
            <Text style={styles.value}>{formData.socialHistory.alcoholUse.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Drug Use:</Text>
            <Text style={styles.value}>{formData.socialHistory.drugUse.status}</Text>
          </View>
        </View>

        {/* Dental History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dental History</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Last Visit:</Text>
            <Text style={styles.value}>{formData.dentalHistory.lastVisit}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Visit Frequency:</Text>
            <Text style={styles.value}>{formData.dentalHistory.frequency}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Brushing Frequency:</Text>
            <Text style={styles.value}>{formData.dentalHistory.brushingFrequency}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Flossing Frequency:</Text>
            <Text style={styles.value}>{formData.dentalHistory.flossingFrequency}</Text>
          </View>
        </View>

        {/* Behavioral Questions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavioral Questions</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Anxiety Level:</Text>
            <Text style={styles.value}>{formData.behavioralQuestions.anxietyLevel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fear Level:</Text>
            <Text style={styles.value}>{formData.behavioralQuestions.fearLevel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Previous Experience:</Text>
            <Text style={styles.value}>{formData.behavioralQuestions.previousExperience}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Concerns:</Text>
            <Text style={styles.value}>{formData.behavioralQuestions.concerns}</Text>
          </View>
        </View>

        {/* Signatures Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Patient Signature:</Text>
            <Text style={styles.value}>{formData.additionalInfo.patientSignature}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formData.additionalInfo.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Provider Signature:</Text>
            <Text style={styles.value}>{formData.additionalInfo.providerSignature}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Provider Date:</Text>
            <Text style={styles.value}>{formData.additionalInfo.providerDate}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </Page>
    </Document>
  );
} 