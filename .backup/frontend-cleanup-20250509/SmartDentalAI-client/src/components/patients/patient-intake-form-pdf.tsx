import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
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
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: "#666",
  },
});

// Add signature styles
const signatureStyles = StyleSheet.create({
  signatureContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  signatureImage: {
    width: 150,
    height: 50,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#666",
  },
});

interface PatientIntakeFormPDFProps {
  patientName: string;
  formData: PatientIntakeFormData;
}

// Helper function to check if a value is non-empty
const hasValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(hasValue);
  return true;
};

export function PatientIntakeFormPDF({ patientName, formData }: PatientIntakeFormPDFProps) {
  // Check if sections have content
  const hasGeneralMedical = Object.values(formData.generalMedical).some(hasValue);
  const hasSymptoms = Object.values(formData.symptoms).some(hasValue);
  const hasMedicalConditions = Object.values(formData.medicalConditions).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
  const hasSocialHistory = Object.values(formData.socialHistory).some(hasValue);
  const hasDentalHistory = Object.values(formData.dentalHistory).some(hasValue);
  const hasBehavioralQuestions = Object.values(formData.behavioralQuestions).some(hasValue);
  const hasAdditionalInfo = Object.values(formData.additionalInfo).some(hasValue);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Intake Form</Text>
          <Text style={styles.subtitle}>Patient: {patientName}</Text>
          <Text style={styles.subtitle}>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Patient Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          {Object.entries(formData.patientInfo)
            .filter(([_, value]) => hasValue(value))
            .map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}:
                </Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
        </View>

        {/* General Medical Section */}
        {hasGeneralMedical && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Medical History</Text>
            {Object.entries(formData.generalMedical)
              .filter(([_, value]) => hasValue(value))
              .map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>
                    {key.replace("has", "").replace(/([A-Z])/g, " $1").trim()}:
                  </Text>
                  <Text style={styles.value}>{value ? "Yes" : "No"}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Symptoms Section */}
        {hasSymptoms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms (Past 6 Months)</Text>
            {Object.entries(formData.symptoms)
              .filter(([_, value]) => hasValue(value))
              .map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>
                    {key.replace("has", "").replace(/([A-Z])/g, " $1").trim()}:
                  </Text>
                  <Text style={styles.value}>{value ? "Yes" : "No"}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Medical Conditions Section */}
        {hasMedicalConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
            {Object.entries(formData.medicalConditions)
              .filter(([_, conditions]) => Array.isArray(conditions) && conditions.length > 0)
              .map(([category, conditions]) => (
                <View key={category}>
                  <Text style={styles.label}>{category}:</Text>
                  <Text style={styles.value}>{conditions.join(", ")}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Social History Section */}
        {hasSocialHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social History</Text>
            {Object.entries(formData.socialHistory)
              .filter(([_, value]) => hasValue(value))
              .map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Dental History Section */}
        {hasDentalHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dental History</Text>
            {Object.entries(formData.dentalHistory)
              .filter(([_, value]) => hasValue(value))
              .map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Behavioral Questions Section */}
        {hasBehavioralQuestions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behavioral Questions</Text>
            {Object.entries(formData.behavioralQuestions)
              .filter(([_, value]) => hasValue(value))
              .map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Signatures Section */}
        {hasAdditionalInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signatures</Text>
            {formData.additionalInfo.patientSignature && (
              <View style={signatureStyles.signatureContainer}>
                <Text style={signatureStyles.signatureLabel}>Patient Signature:</Text>
                <Image
                  src={formData.additionalInfo.patientSignature}
                  style={signatureStyles.signatureImage}
                />
                {formData.additionalInfo.date && (
                  <Text style={signatureStyles.signatureLabel}>
                    Date: {formData.additionalInfo.date}
                  </Text>
                )}
              </View>
            )}
            {formData.additionalInfo.providerSignature && (
              <View style={signatureStyles.signatureContainer}>
                <Text style={signatureStyles.signatureLabel}>Provider Signature:</Text>
                <Image
                  src={formData.additionalInfo.providerSignature}
                  style={signatureStyles.signatureImage}
                />
                {formData.additionalInfo.providerDate && (
                  <Text style={signatureStyles.signatureLabel}>
                    Date: {formData.additionalInfo.providerDate}
                  </Text>
                )}
              </View>
            )}
            {!formData.additionalInfo.patientSignature && !formData.additionalInfo.providerSignature && (
              <Text style={styles.value}>Not signed</Text>
            )}
          </View>
        )}

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </Page>
    </Document>
  );
} 