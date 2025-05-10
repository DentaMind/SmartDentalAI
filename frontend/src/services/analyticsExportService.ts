import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

/**
 * Service for exporting analytics data in various formats
 */
class AnalyticsExportService {
  /**
   * Convert JSON data to CSV format
   * 
   * @param data - Array of objects to convert to CSV
   * @param columns - Optional column definitions with headers
   * @returns CSV string
   */
  private jsonToCSV(
    data: any[], 
    columns?: { field: string, header: string }[]
  ): string {
    if (!data || data.length === 0) {
      return '';
    }

    // If columns not provided, generate from first item
    if (!columns) {
      const firstItem = data[0];
      columns = Object.keys(firstItem).map(key => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
      }));
    }

    // Create header row
    const header = columns.map(col => `"${col.header}"`).join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return columns!.map(col => {
        // Handle various data types
        const value = item[col.field];
        if (value === null || value === undefined) {
          return '""';
        }
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return value;
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      }).join(',');
    }).join('\n');
    
    return `${header}\n${rows}`;
  }
  
  /**
   * Export data as CSV file
   * 
   * @param data - Data to export
   * @param columns - Optional column definitions
   * @param filename - Filename for the downloaded file
   */
  exportCSV(
    data: any[],
    columns?: { field: string, header: string }[],
    filename: string = 'analytics_export.csv'
  ): void {
    const csv = this.jsonToCSV(data, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
  }
  
  /**
   * Export feedback analytics as CSV
   * 
   * @param feedbackData - Feedback analytics data
   * @param providerId - Provider ID used for filtering (for filename)
   * @param period - Time period used for filtering (for filename)
   */
  exportFeedbackAnalyticsCSV(
    feedbackData: any,
    providerId: string = 'all',
    period: string = 'month'
  ): void {
    // Create trend data export
    if (feedbackData.trend_data && feedbackData.trend_data.length > 0) {
      const columns = [
        { field: 'date', header: 'Date' },
        { field: 'total', header: 'Total Suggestions' },
        { field: 'accepted', header: 'Accepted' },
        { field: 'rejected', header: 'Rejected' },
        { field: 'acceptance_rate', header: 'Acceptance Rate (%)' },
        { field: 'rejection_rate', header: 'Rejection Rate (%)' }
      ];
      
      const filename = `treatment_feedback_trends_${providerId}_${period}.csv`;
      this.exportCSV(feedbackData.trend_data, columns, filename);
    }
    
    // Create specialty breakdown export
    if (feedbackData.by_specialty && feedbackData.by_specialty.length > 0) {
      const columns = [
        { field: 'name', header: 'Specialty' },
        { field: 'total', header: 'Total Suggestions' },
        { field: 'accepted', header: 'Accepted' },
        { field: 'acceptance_rate', header: 'Acceptance Rate (%)' }
      ];
      
      const filename = `specialty_feedback_${providerId}_${period}.csv`;
      this.exportCSV(feedbackData.by_specialty, columns, filename);
    }
  }
  
  /**
   * Export evidence analytics as CSV
   * 
   * @param evidenceData - Evidence analytics data
   * @param providerId - Provider ID used for filtering (for filename)
   * @param period - Time period used for filtering (for filename)
   */
  exportEvidenceAnalyticsCSV(
    evidenceData: any,
    providerId: string = 'all',
    period: string = 'month'
  ): void {
    // Create evidence types export
    if (evidenceData.evidence_types && evidenceData.evidence_types.length > 0) {
      const columns = [
        { field: 'name', header: 'Evidence Type' },
        { field: 'accuracy', header: 'Accuracy (1-5)' },
        { field: 'relevance', header: 'Relevance (0-1)' },
        { field: 'count', header: 'Usage Count' }
      ];
      
      const filename = `evidence_types_${providerId}_${period}.csv`;
      this.exportCSV(evidenceData.evidence_types, columns, filename);
    }
    
    // Create top evidence sources export
    if (evidenceData.top_evidence_sources && evidenceData.top_evidence_sources.length > 0) {
      const columns = [
        { field: 'title', header: 'Title' },
        { field: 'publication', header: 'Publication' },
        { field: 'evidence_grade', header: 'Grade' },
        { field: 'usage_count', header: 'Usage Count' }
      ];
      
      const filename = `top_evidence_${providerId}_${period}.csv`;
      this.exportCSV(evidenceData.top_evidence_sources, columns, filename);
    }
    
    // Create evidence heatmap data export
    if (evidenceData.evidence_heatmap && evidenceData.evidence_heatmap.data.length > 0) {
      const columns = [
        { field: 'evidence_type', header: 'Evidence Type' },
        { field: 'category', header: 'Treatment Category' },
        { field: 'score', header: 'Reliability Score' }
      ];
      
      const filename = `evidence_heatmap_${providerId}_${period}.csv`;
      this.exportCSV(evidenceData.evidence_heatmap.data, columns, filename);
    }
  }
  
  /**
   * Export treatment patterns as CSV
   * 
   * @param patternsData - Treatment patterns data
   * @param providerId - Provider ID used for filtering (for filename)
   * @param period - Time period used for filtering (for filename)
   */
  exportTreatmentPatternsCSV(
    patternsData: any,
    providerId: string = 'all',
    period: string = 'month'
  ): void {
    // Create procedure types export
    if (patternsData.by_procedure_type) {
      const procedureData = Object.entries(patternsData.by_procedure_type).map(([type, count]) => ({
        procedure_type: type,
        count: count
      }));
      
      const columns = [
        { field: 'procedure_type', header: 'Procedure Type' },
        { field: 'count', header: 'Count' }
      ];
      
      const filename = `procedure_types_${providerId}_${period}.csv`;
      this.exportCSV(procedureData, columns, filename);
    }
    
    // Create top procedures export
    if (patternsData.top_procedures && patternsData.top_procedures.length > 0) {
      const columns = [
        { field: 'name', header: 'Procedure' },
        { field: 'count', header: 'Count' }
      ];
      
      const filename = `top_procedures_${providerId}_${period}.csv`;
      this.exportCSV(patternsData.top_procedures, columns, filename);
    }
    
    // Create confidence vs. acceptance export
    if (patternsData.confidence_vs_acceptance && patternsData.confidence_vs_acceptance.length > 0) {
      const columns = [
        { field: 'confidence_level', header: 'Confidence Level' },
        { field: 'total', header: 'Total Suggestions' },
        { field: 'accepted', header: 'Accepted' },
        { field: 'acceptance_rate', header: 'Acceptance Rate (%)' },
        { field: 'trendline', header: 'Trendline Value' }
      ];
      
      const filename = `confidence_acceptance_${providerId}_${period}.csv`;
      this.exportCSV(patternsData.confidence_vs_acceptance, columns, filename);
    }
  }
  
  /**
   * Generate PDF report of analytics dashboard
   * 
   * @param feedbackData - Feedback analytics data
   * @param evidenceData - Evidence analytics data
   * @param patternsData - Treatment patterns data
   * @param providerId - Provider ID used for filtering
   * @param period - Time period used for filtering
   * @returns Blob containing the PDF
   */
  generateAnalyticsPDF(
    feedbackData: any,
    evidenceData: any,
    patternsData: any,
    providerId: string = 'all',
    period: string = 'month'
  ): Blob {
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(0, 91, 187);
    doc.text('DentaMind AI Analytics Report', 105, 20, { align: 'center' });
    
    // Add subtitle with period and provider info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    
    const periodText = {
      'week': 'Last 7 Days',
      'month': 'Last 30 Days',
      'quarter': 'Last 90 Days',
      'year': 'Last 365 Days'
    }[period] || 'Custom Period';
    
    const providerText = providerId === 'all' ? 'All Providers' : `Provider ID: ${providerId}`;
    doc.text(`${periodText} • ${providerText}`, 105, 27, { align: 'center' });
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 33, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 38, 190, 38);
    
    // Add summary section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 20, 48);
    
    // Create summary table
    const summaryData = [
      ['Total Suggestions', feedbackData ? feedbackData.total_count.toString() : '0'],
      ['Acceptance Rate', feedbackData ? `${Math.round(feedbackData.acceptance_rate)}%` : '0%'],
      ['Average Evidence Quality', evidenceData ? evidenceData.avg_evidence_quality.toFixed(2) : 'N/A'],
      ['Top Evidence Grade', evidenceData && evidenceData.top_evidence_grade ? evidenceData.top_evidence_grade : 'N/A']
    ];
    
    // @ts-ignore - jspdf-autotable plugin extension
    doc.autoTable({
      startY: 52,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 91, 187],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' }
      }
    });
    
    // Add feedback section
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Treatment Feedback', 20, currentY);
    currentY += 5;
    
    // Add acceptance breakdown
    if (feedbackData) {
      const acceptanceData = [
        ['Accepted', feedbackData.accepted_count.toString()],
        ['Rejected', feedbackData.rejected_count.toString()],
        ['Modified', feedbackData.modified_count.toString()]
      ];
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Action', 'Count']],
        body: acceptanceData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add specialty breakdown if available
    if (feedbackData && feedbackData.by_specialty && feedbackData.by_specialty.length > 0) {
      doc.setFontSize(14);
      doc.text('Acceptance Rate by Specialty', 20, currentY);
      currentY += 5;
      
      const specialtyData = feedbackData.by_specialty.map((specialty: any) => [
        specialty.name,
        specialty.total.toString(),
        specialty.accepted.toString(),
        `${specialty.acceptance_rate}%`
      ]);
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Specialty', 'Total', 'Accepted', 'Acceptance Rate']],
        body: specialtyData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add evidence section
    // Check if we need a new page
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Evidence Reliability', 20, currentY);
    currentY += 5;
    
    // Add evidence type summary if available
    if (evidenceData && evidenceData.evidence_types && evidenceData.evidence_types.length > 0) {
      const evidenceTypeData = evidenceData.evidence_types.map((type: any) => [
        type.name,
        type.accuracy.toFixed(2),
        type.relevance.toFixed(2),
        type.count.toString()
      ]);
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Evidence Type', 'Accuracy (1-5)', 'Relevance (0-1)', 'Count']],
        body: evidenceTypeData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add top evidence sources if available
    if (evidenceData && evidenceData.top_evidence_sources && evidenceData.top_evidence_sources.length > 0) {
      // Check if we need a new page
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Top Evidence Sources', 20, currentY);
      currentY += 5;
      
      const topSourcesData = evidenceData.top_evidence_sources.map((source: any) => [
        source.title,
        source.publication || 'N/A',
        source.evidence_grade,
        source.usage_count.toString()
      ]);
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Title', 'Publication', 'Grade', 'Usage Count']],
        body: topSourcesData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'ellipsize'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add treatment patterns section
    // Always start on a new page
    doc.addPage();
    currentY = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Treatment Patterns', 20, currentY);
    currentY += 5;
    
    // Add confidence vs. acceptance correlation if available
    if (patternsData && patternsData.confidence_vs_acceptance && patternsData.confidence_vs_acceptance.length > 0) {
      doc.setFontSize(14);
      doc.text('Confidence vs. Acceptance Rate', 20, currentY);
      currentY += 5;
      
      const confidenceData = patternsData.confidence_vs_acceptance.map((item: any) => [
        item.confidence_level,
        item.total.toString(),
        item.accepted.toString(),
        `${item.acceptance_rate}%`,
        item.trendline ? `${item.trendline}%` : 'N/A'
      ]);
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Confidence', 'Total', 'Accepted', 'Acceptance Rate', 'Trendline']],
        body: confidenceData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add top procedures if available
    if (patternsData && patternsData.top_procedures && patternsData.top_procedures.length > 0) {
      // Check if we need a new page
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Top Procedures', 20, currentY);
      currentY += 5;
      
      const proceduresData = patternsData.top_procedures.map((proc: any) => [
        proc.name,
        proc.count.toString()
      ]);
      
      // @ts-ignore - jspdf-autotable plugin extension
      doc.autoTable({
        startY: currentY,
        head: [['Procedure', 'Count']],
        body: proceduresData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 91, 187],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 30, halign: 'center' }
        }
      });
    }
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Add footer text
      doc.text('This report contains AI performance analytics and should be reviewed by dental administrators', 105, 285, { align: 'center' });
      
      // Add page number
      doc.text(`Page ${i} of ${pageCount}`, 185, 285, { align: 'right' });
    }
    
    // Return the PDF as a blob
    return doc.output('blob');
  }
  
  /**
   * Export analytics dashboard data as PDF
   * 
   * @param feedbackData - Feedback analytics data
   * @param evidenceData - Evidence analytics data
   * @param patternsData - Treatment patterns data
   * @param providerId - Provider ID used for filtering
   * @param period - Time period used for filtering
   */
  async exportAnalyticsPDF(
    feedbackData: any,
    evidenceData: any,
    patternsData: any,
    providerId: string = 'all',
    period: string = 'month'
  ): Promise<void> {
    const pdfBlob = this.generateAnalyticsPDF(
      feedbackData,
      evidenceData,
      patternsData,
      providerId,
      period
    );
    
    // Generate filename
    const periodText = {
      'week': '7d',
      'month': '30d',
      'quarter': '90d',
      'year': '365d'
    }[period] || period;
    
    const providerText = providerId === 'all' ? 'all_providers' : `provider_${providerId}`;
    const filename = `dentamind_analytics_${providerText}_${periodText}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Trigger download
    saveAs(pdfBlob, filename);
  }
}

const analyticsExportService = new AnalyticsExportService();
export default analyticsExportService; 