import { BRANDING } from '../constants/branding';

interface BrandedDocumentOptions {
  title?: string;
  date?: Date;
  recipientName?: string;
  recipientEmail?: string;
  adminName?: string;
  adminId?: string;
  includeFooter?: boolean;
}

export const brandingUtils = {
  /**
   * Generates HTML for a branded letterhead
   */
  generateLetterhead: (options: BrandedDocumentOptions = {}) => {
    const {
      title,
      date = new Date(),
      recipientName,
      recipientEmail,
    } = options;

    return `
      <div style="
        font-family: ${BRANDING.fonts.primary};
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      ">
        <div style="text-align: center; margin-bottom: 40px;">
          <img 
            src="${BRANDING.logo.full}" 
            alt="${BRANDING.name}" 
            style="max-width: 200px;"
          />
          <h2 style="
            font-family: ${BRANDING.fonts.secondary};
            color: ${BRANDING.colors.secondary};
            margin-top: 16px;
          ">${BRANDING.tagline}</h2>
        </div>
        
        ${title ? `<h1 style="
          font-family: ${BRANDING.fonts.secondary};
          color: ${BRANDING.colors.secondary};
          margin-bottom: 24px;
        ">${title}</h1>` : ''}

        <div style="text-align: right; margin-bottom: 32px;">
          <p style="color: ${BRANDING.colors.secondary};">
            ${date.toLocaleDateString()}
          </p>
        </div>

        ${recipientName ? `<div style="margin-bottom: 32px;">
          <p style="color: ${BRANDING.colors.secondary};">
            ${recipientName}${recipientEmail ? `<br/>${recipientEmail}` : ''}
          </p>
        </div>` : ''}
      </div>
    `;
  },

  /**
   * Generates HTML for a branded email template
   */
  generateEmailTemplate: (content: string, options: BrandedDocumentOptions = {}) => {
    const { adminName, adminId, includeFooter = true } = options;

    return `
      <div style="
        font-family: ${BRANDING.fonts.primary};
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      ">
        <div style="text-align: center; margin-bottom: 32px;">
          <img 
            src="${BRANDING.logo.full}" 
            alt="${BRANDING.name}" 
            style="max-width: 150px;"
          />
        </div>

        <div style="
          color: ${BRANDING.colors.secondary};
          line-height: 1.6;
        ">
          ${content}
        </div>

        ${includeFooter ? `<div style="
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid ${BRANDING.colors.accent};
          font-size: 14px;
          color: ${BRANDING.colors.secondary};
        ">
          ${adminName && adminId ? BRANDING.email.footerTemplate(adminName, adminId) : `
            Best regards,<br/>
            The ${BRANDING.name} Team
          `}
        </div>` : ''}
      </div>
    `;
  },

  /**
   * Generates HTML for a branded AI summary
   */
  generateAISummary: (
    summary: string,
    modelVersion: string,
    confidence: number,
    adminName: string,
    adminId: string
  ) => {
    return `
      <div style="
        font-family: ${BRANDING.fonts.primary};
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: ${BRANDING.colors.background};
      ">
        <div style="
          padding: 20px;
          border: 1px solid ${BRANDING.colors.accent};
          border-radius: 8px;
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          ">
            <img 
              src="${BRANDING.logo.text}" 
              alt="${BRANDING.name}" 
              style="height: 30px; margin-right: 12px;"
            />
            <span style="
              color: ${BRANDING.colors.secondary};
              font-family: ${BRANDING.fonts.secondary};
            ">AI Summary</span>
          </div>

          <div style="
            color: ${BRANDING.colors.secondary};
            line-height: 1.6;
            margin-bottom: 20px;
          ">
            ${summary}
          </div>

          <div style="
            font-size: 14px;
            color: ${BRANDING.colors.secondary};
            opacity: 0.8;
          ">
            <div>Model Version: ${modelVersion}</div>
            <div>Confidence: ${(confidence * 100).toFixed(1)}%</div>
            <div>Reviewed by: ${adminName} (ID: ${adminId})</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
  }
}; 