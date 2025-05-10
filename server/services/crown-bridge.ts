import { CrownBridgeCase, CrownBridgeSettings } from '../types/crown-bridge';
import * as THREE from 'three';
import { Database } from '../database';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class CrownBridgeService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async getCasesByPatient(patientId: string): Promise<CrownBridgeCase[]> {
    const cases = await this.db.query(
      'SELECT * FROM crown_bridge_cases WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId]
    );

    return cases.map(this.mapDbCaseToCase);
  }

  async getCase(caseId: string): Promise<CrownBridgeCase | null> {
    const [caseData] = await this.db.query(
      'SELECT * FROM crown_bridge_cases WHERE id = $1',
      [caseId]
    );

    return caseData ? this.mapDbCaseToCase(caseData) : null;
  }

  async saveCase(caseData: Omit<CrownBridgeCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await this.db.query(
      `INSERT INTO crown_bridge_cases (
        patient_id,
        preparation_scan,
        opposing_scan,
        settings,
        design,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        caseData.patientId,
        caseData.preparationScan ? JSON.stringify(caseData.preparationScan.toJSON()) : null,
        caseData.opposingScan ? JSON.stringify(caseData.opposingScan.toJSON()) : null,
        JSON.stringify(caseData.settings),
        caseData.design ? JSON.stringify(caseData.design.toJSON()) : null,
        new Date(),
        new Date()
      ]
    );

    return result[0].id;
  }

  async updateCase(caseId: string, updates: Partial<CrownBridgeCase>): Promise<CrownBridgeCase> {
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (updates.preparationScan) {
      updateFields.push(`preparation_scan = $${paramCount}`);
      updateValues.push(JSON.stringify(updates.preparationScan.toJSON()));
      paramCount++;
    }

    if (updates.opposingScan) {
      updateFields.push(`opposing_scan = $${paramCount}`);
      updateValues.push(JSON.stringify(updates.opposingScan.toJSON()));
      paramCount++;
    }

    if (updates.settings) {
      updateFields.push(`settings = $${paramCount}`);
      updateValues.push(JSON.stringify(updates.settings));
      paramCount++;
    }

    if (updates.design) {
      updateFields.push(`design = $${paramCount}`);
      updateValues.push(JSON.stringify(updates.design.toJSON()));
      paramCount++;
    }

    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());
    paramCount++;

    updateValues.push(caseId);

    const query = `
      UPDATE crown_bridge_cases 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const [updatedCase] = await this.db.query(query, updateValues);
    return this.mapDbCaseToCase(updatedCase);
  }

  async deleteCase(caseId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM crown_bridge_cases WHERE id = $1',
      [caseId]
    );
  }

  async exportCasesToCSV(patientId: string): Promise<string> {
    const cases = await this.getCasesByPatient(patientId);
    
    const headers = [
      'Case ID',
      'Created At',
      'Design Type',
      'Material',
      'Margin Type',
      'Occlusion Type',
      'Minimum Thickness'
    ];

    const rows = cases.map(caseData => [
      caseData.id,
      new Date(caseData.createdAt).toISOString(),
      caseData.settings.designType,
      caseData.settings.material,
      caseData.settings.marginType,
      caseData.settings.occlusionType,
      caseData.settings.minimumThickness
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  async exportCasesToPDF(patientId: string): Promise<Buffer> {
    const cases = await this.getCasesByPatient(patientId);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = 20;
    let y = height - 50;

    // Add title
    page.drawText('Crown & Bridge Cases Report', {
      x: 50,
      y,
      size: 16,
      font,
      color: rgb(0, 0, 0)
    });
    y -= lineHeight * 2;

    // Add patient info
    page.drawText(`Patient ID: ${patientId}`, {
      x: 50,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
    y -= lineHeight;

    // Add cases
    cases.forEach(caseData => {
      if (y < 50) {
        page = pdfDoc.addPage();
        y = height - 50;
      }

      const caseInfo = [
        `Case ID: ${caseData.id}`,
        `Created: ${new Date(caseData.createdAt).toLocaleString()}`,
        `Design Type: ${caseData.settings.designType}`,
        `Material: ${caseData.settings.material}`,
        `Margin Type: ${caseData.settings.marginType}`,
        `Occlusion Type: ${caseData.settings.occlusionType}`,
        `Minimum Thickness: ${caseData.settings.minimumThickness}mm`
      ];

      caseInfo.forEach(line => {
        page.drawText(line, {
          x: 50,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        });
        y -= lineHeight;
      });

      y -= lineHeight;
    });

    return Buffer.from(await pdfDoc.save());
  }

  private mapDbCaseToCase(dbCase: any): CrownBridgeCase {
    return {
      id: dbCase.id,
      patientId: dbCase.patient_id,
      preparationScan: dbCase.preparation_scan ? new THREE.BufferGeometry().fromJSON(JSON.parse(dbCase.preparation_scan)) : null,
      opposingScan: dbCase.opposing_scan ? new THREE.BufferGeometry().fromJSON(JSON.parse(dbCase.opposing_scan)) : null,
      settings: dbCase.settings as CrownBridgeSettings,
      design: dbCase.design ? new THREE.BufferGeometry().fromJSON(JSON.parse(dbCase.design)) : null,
      createdAt: new Date(dbCase.created_at),
      updatedAt: new Date(dbCase.updated_at)
    };
  }
} 