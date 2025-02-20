import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "auth.login": "Login",
      "auth.register": "Register",
      "auth.username": "Username",
      "auth.password": "Password",
      "nav.home": "Home",
      "nav.patients": "Patients",
      "nav.appointments": "Appointments",
      "nav.treatmentPlans": "Treatment Plans",
      "patient.add": "Add Patient",
      "patient.name": "Patient Name",
      "patient.dob": "Date of Birth",
      "patient.contact": "Contact",
      "appointment.schedule": "Schedule Appointment",
      "appointment.date": "Date",
      "appointment.time": "Time",
      "appointment.online": "Online Consultation",
      "treatment.create": "Create Treatment Plan",
      "treatment.diagnosis": "Diagnosis",
      "treatment.procedures": "Procedures",
      "treatment.cost": "Cost",
    },
  },
  es: {
    translation: {
      "auth.login": "Iniciar Sesión",
      "auth.register": "Registrarse",
      "auth.username": "Usuario",
      "auth.password": "Contraseña",
      "nav.home": "Inicio",
      "nav.patients": "Pacientes",
      "nav.appointments": "Citas",
      "nav.treatmentPlans": "Planes de Tratamiento",
      "patient.add": "Agregar Paciente",
      "patient.name": "Nombre del Paciente",
      "patient.dob": "Fecha de Nacimiento",
      "patient.contact": "Contacto",
      "appointment.schedule": "Programar Cita",
      "appointment.date": "Fecha",
      "appointment.time": "Hora",
      "appointment.online": "Consulta en Línea",
      "treatment.create": "Crear Plan de Tratamiento",
      "treatment.diagnosis": "Diagnóstico",
      "treatment.procedures": "Procedimientos",
      "treatment.cost": "Costo",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
