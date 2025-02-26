
import { storage } from "../storage";
import { InsertPayment, Payment } from "@shared/schema";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function createPayment(data: InsertPayment): Promise<Payment> {
  const payment = await storage.createPayment(data);
  
  // Send payment confirmation email
  const treatmentPlan = await storage.getTreatmentPlan(data.treatmentPlanId);
  const patient = await storage.getPatient(data.patientId);
  
  await transporter.sendMail({
    to: patient.contact,
    subject: "Payment Confirmation - SmartDental",
    html: `
      <h2>Payment Confirmation</h2>
      <p>Amount: $${data.amount}</p>
      <p>Treatment: ${treatmentPlan.diagnosis}</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    `,
  });

  return payment;
}
