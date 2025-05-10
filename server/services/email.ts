import nodemailer from 'nodemailer';
import { config } from '../config';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AuditService } from './audit';
import { MemStorage } from '../storage';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface VersionComparisonEmailData {
  version1: string;
  version2: string;
  accuracyDeltas: Record<string, number>;
  thresholdDeltas: Record<string, number>;
  reviewImpactDelta: number;
  summary: string;
  recipientEmail: string;
  adminUserId: string;
  adminUserName: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private auditService: AuditService;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    } as EmailConfig);

    this.auditService = new AuditService(new MemStorage());
  }

  private generatePDF(data: VersionComparisonEmailData): Buffer {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(`Model Version Comparison: v${data.version1} vs v${data.version2}`, 14, 20);

    // AI Summary
    doc.setFontSize(12);
    doc.text('AI Analysis Summary', 14, 30);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(data.summary, 180);
    doc.text(summaryLines, 14, 40);

    // Accuracy Changes
    doc.setFontSize(12);
    doc.text('Accuracy Changes by Condition', 14, doc.getTextDimensions(summaryLines).h + 50);
    const accuracyData = Object.entries(data.accuracyDeltas).map(([condition, delta]) => [
      condition,
      `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`,
    ]);
    (doc as any).autoTable({
      startY: doc.getTextDimensions(summaryLines).h + 55,
      head: [['Condition', 'Change']],
      body: accuracyData,
    });

    // Threshold Changes
    doc.text('Confidence Threshold Changes', 14, (doc as any).lastAutoTable.finalY + 10);
    const thresholdData = Object.entries(data.thresholdDeltas).map(([condition, delta]) => [
      condition,
      `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`,
    ]);
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Condition', 'Change']],
      body: thresholdData,
    });

    // Review Impact
    doc.text('Review Impact', 14, (doc as any).lastAutoTable.finalY + 10);
    doc.text(`${data.reviewImpactDelta > 0 ? '+' : ''}${data.reviewImpactDelta} reviews`, 14, (doc as any).lastAutoTable.finalY + 20);

    return Buffer.from(doc.output('arraybuffer'));
  }

  async sendVersionComparison(data: VersionComparisonEmailData): Promise<void> {
    const pdfBuffer = this.generatePDF(data);

    // Send email
    await this.transporter.sendMail({
      from: `"DentaMind AI" <${config.email.user}>`,
      to: data.recipientEmail,
      subject: `Model Version Comparison: v${data.version1} vs v${data.version2}`,
      text: data.summary,
      html: `
        <h2>Model Version Comparison: v${data.version1} vs v${data.version2}</h2>
        <p>${data.summary}</p>
        <p>Please find the detailed comparison report attached.</p>
        <p>This email was sent by ${data.adminUserName} (${data.adminUserId}).</p>
      `,
      attachments: [
        {
          filename: `version-comparison-${data.version1}-vs-${data.version2}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Log the activity
    await this.auditService.logVersionComparison(
      data.adminUserId,
      data.adminUserName,
      data.version1,
      data.version2,
      data.recipientEmail,
      data.summary,
      {
        accuracyDeltas: data.accuracyDeltas,
        thresholdDeltas: data.thresholdDeltas,
        reviewImpactDelta: data.reviewImpactDelta,
      }
    );
  }
}

export const emailService = new EmailService(); 