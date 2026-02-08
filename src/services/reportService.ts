/**
 * REPORT GENERATION SERVICE
 * Handles PDF generation and sharing for sessions and timelines
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { PatientSession, PatientMedia, ClinicSettings } from '@/src/types/media';

/**
 * Generate a simple text-based session report
 * Can be converted to PDF or shared as text
 */
export async function generateSessionReport(
  session: PatientSession,
  media: PatientMedia[],
  patientName: string,
  clinicName: string
): Promise<string> {
  const sessionMedia = media.filter(m => session.mediaIds.includes(m.id));
  const dateStr = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = new Date(session.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let reportContent = `
DENTAL CLINIC SESSION REPORT
═══════════════════════════════════════════════════════════

CLINIC INFORMATION:
Clinic Name: ${clinicName}

PATIENT INFORMATION:
Patient Name: ${patientName}

SESSION DETAILS:
Session Title: ${session.title}
Date: ${dateStr}
Time: ${timeStr}

Description:
${session.description || '(No description provided)'}

MEDIA INFORMATION:
Total Images: ${sessionMedia.length}

`;

  sessionMedia.forEach((media, index) => {
    const isAnnotated = media.hasAnnotation ? '✓ ANNOTATED' : '';
    const createdDate = new Date(media.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
    reportContent += `\n  ${index + 1}. Image uploaded on ${createdDate} ${isAnnotated}`;
  });

  reportContent += `

═══════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════`;

  return reportContent;
}

/**
 * Generate timeline report covering all sessions and images
 */
export async function generateTimelineReport(
  sessions: PatientSession[],
  media: PatientMedia[],
  patientName: string,
  clinicName: string,
  dateRange?: { start: number; end: number }
): Promise<string> {
  // Filter by date range if provided
  let filteredSessions = sessions;
  let filteredMedia = media;

  if (dateRange) {
    filteredSessions = sessions.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
    filteredMedia = media.filter(m => m.createdAt >= dateRange.start && m.createdAt <= dateRange.end);
  }

  const dateRangeStr = dateRange
    ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
    : 'All Time';

  let reportContent = `
DENTAL TREATMENT TIMELINE REPORT
═══════════════════════════════════════════════════════════

CLINIC INFORMATION:
Clinic Name: ${clinicName}

PATIENT INFORMATION:
Patient Name: ${patientName}

REPORT PERIOD:
Date Range: ${dateRangeStr}

SUMMARY:
Total Sessions: ${filteredSessions.length}
Total Images: ${filteredMedia.length}
Annotated Images: ${filteredMedia.filter(m => m.hasAnnotation).length}

SESSIONS (${filteredSessions.length}):
───────────────────────────────────────────────────────────`;

  filteredSessions.sort((a, b) => b.date - a.date).forEach((session, index) => {
    const dateStr = new Date(session.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
    const sessionMediaCount = session.mediaIds.length;
    reportContent += `\n\n${index + 1}. ${session.title}
   Date: ${dateStr}
   Images: ${sessionMediaCount}`;
    if (session.description) {
      reportContent += `\n   Notes: ${session.description}`;
    }
  });

  reportContent += `\n\nIMAGES (${filteredMedia.length}):
───────────────────────────────────────────────────────────`;

  filteredMedia.sort((a, b) => b.createdAt - a.createdAt).forEach((image, index) => {
    const dateStr = new Date(image.createdAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
    const timeStr = new Date(image.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const annotatedStatus = image.hasAnnotation ? ' [ANNOTATED]' : '';
    const sessionInfo = image.sessionId
      ? ` - In Session`
      : ` - No Session`;

    reportContent += `\n\n${index + 1}. ${dateStr} ${timeStr}${annotatedStatus}${sessionInfo}`;
  });

  reportContent += `\n\n═══════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════`;

  return reportContent;
}

/**
 * Generate an HTML-based session report for PDF conversion
 */
export async function generateSessionReportHTML(
  session: PatientSession,
  media: PatientMedia[],
  patientName: string,
  clinicName: string,
  clinicSettings?: ClinicSettings
): Promise<string> {
  const sessionMedia = media.filter(m => session.mediaIds.includes(m.id));
  const dateStr = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = new Date(session.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Use clinic branding if provided
  const primaryColor = clinicSettings?.primaryColor || '#D4AF37';
  const secondaryColor = clinicSettings?.secondaryColor || '#0B0F1A';
  const logoUrl = clinicSettings?.logoUrl;
  const displayClinicName = clinicSettings?.clinicName || clinicName;

  // Build image rows (max 2 images per row for A4 layout)
  let imagesHTML = '';
  for (let i = 0; i < sessionMedia.length; i += 2) {
    const img1 = sessionMedia[i];
    const img2 = sessionMedia[i + 1];
    
    imagesHTML += '<tr style="page-break-inside: avoid;">';
    imagesHTML += `
      <td style="padding: 10px; vertical-align: top; width: 50%;">
        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
          <img src="${img1.originalUrl}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px;" />
          <div style="margin-top: 8px; font-size: 11px; color: #666;">
            <p style="margin: 4px 0;"><strong>Uploaded:</strong> ${new Date(img1.createdAt).toLocaleDateString()}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${img1.hasAnnotation ? '✓ Annotated' : 'Original'}</p>
          </div>
        </div>
      </td>
    `;
    
    if (img2) {
      imagesHTML += `
        <td style="padding: 10px; vertical-align: top; width: 50%;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <img src="${img2.originalUrl}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px;" />
            <div style="margin-top: 8px; font-size: 11px; color: #666;">
              <p style="margin: 4px 0;"><strong>Uploaded:</strong> ${new Date(img2.createdAt).toLocaleDateString()}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${img2.hasAnnotation ? '✓ Annotated' : 'Original'}</p>
            </div>
          </div>
        </td>
      `;
    } else {
      imagesHTML += '<td style="padding: 10px; width: 50%;"></td>';
    }
    imagesHTML += '</tr>';
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #fff;
    }
    
    .page {
      max-width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .clinic-logo {
      max-width: 80px;
      max-height: 40px;
      object-fit: contain;
    }
    
    .clinic-name {
      font-size: 24px;
      font-weight: 700;
      color: ${primaryColor};
      margin: 0;
    }
    
    .clinic-subtitle {
      font-size: 12px;
      color: #999;
      margin: 4px 0 0 0;
    }
    
    .report-date {
      font-size: 11px;
      color: #999;
      text-align: right;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #000;
      border-left: 4px solid ${primaryColor};
      padding-left: 10px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
      width: 120px;
      min-width: 120px;
    }
    
    .info-value {
      color: #333;
      flex: 1;
    }
    
    .description-box {
      background-color: #f9f9f9;
      border-left: 3px solid #D4AF37;
      padding: 10px;
      margin-top: 10px;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    .image-count {
      background-color: #f0f0f0;
      padding: 8px;
      border-radius: 4px;
      margin: 10px 0;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: none;
      }
      .page {
        max-width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${logoUrl ? `<img src="${logoUrl}" class="clinic-logo" alt="Clinic Logo" />` : ''}
        <div>
          <p class="clinic-name">${displayClinicName}</p>
          <p class="clinic-subtitle">Dental Treatment Record</p>
        </div>
      </div>
      <div class="report-date">
        <p style="margin: 0;">Report Generated</p>
        <p style="margin: 0; font-weight: 600;">${new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <!-- Patient Info -->
    <div class="section">
      <div class="section-title">Patient Information</div>
      <div class="info-row">
        <div class="info-label">Patient Name:</div>
        <div class="info-value">${patientName}</div>
      </div>
    </div>

    <!-- Session Info -->
    <div class="section">
      <div class="section-title">Session Details</div>
      <div class="info-row">
        <div class="info-label">Session Title:</div>
        <div class="info-value">${session.title}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Date:</div>
        <div class="info-value">${dateStr}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Time:</div>
        <div class="info-value">${timeStr}</div>
      </div>
      ${session.description ? `
        <div class="section-title" style="margin-top: 12px;">Notes</div>
        <div class="description-box">${session.description}</div>
      ` : ''}
    </div>

    <!-- Images -->
    ${sessionMedia.length > 0 ? `
      <div class="section">
        <div class="section-title">Treatment Images</div>
        <div class="image-count">${sessionMedia.length} image${sessionMedia.length !== 1 ? 's' : ''} in this session</div>
        <table>
          ${imagesHTML}
        </table>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>This is an official record from ${displayClinicName}. Confidential.</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate an HTML-based timeline report for PDF conversion
 */
export async function generateTimelineReportHTML(
  sessions: PatientSession[],
  media: PatientMedia[],
  patientName: string,
  clinicName: string,
  dateRange?: { start: number; end: number },
  clinicSettings?: ClinicSettings
): Promise<string> {
  // Filter sessions by date range if provided
  let filteredSessions = sessions;
  if (dateRange) {
    filteredSessions = sessions.filter(s => {
      const sessionTime = new Date(s.date).getTime();
      return sessionTime >= dateRange.start && sessionTime <= dateRange.end;
    });
  }

  // Use clinic branding if provided
  const primaryColor = clinicSettings?.primaryColor || '#D4AF37';
  const secondaryColor = clinicSettings?.secondaryColor || '#0B0F1A';
  const logoUrl = clinicSettings?.logoUrl;
  const displayClinicName = clinicSettings?.clinicName || clinicName;

  // Build session summaries
  let sessionsHTML = '';
  filteredSessions.forEach((session, idx) => {
    const sessionMedia = media.filter(m => session.mediaIds.includes(m.id));
    const dateStr = new Date(session.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    sessionsHTML += `
      <div style="page-break-inside: avoid; margin-bottom: 20px; padding: 12px; border-left: 4px solid #D4AF37; background-color: #f9f9f9;">
        <div style="font-weight: 700; color: #D4AF37; margin-bottom: 8px;">${idx + 1}. ${session.title}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Images:</strong> ${sessionMedia.length}
          ${session.description ? `<br/><strong>Notes:</strong> ${session.description.substring(0, 100)}${session.description.length > 100 ? '...' : ''}` : ''}
        </div>
      </div>
    `;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #fff;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .clinic-logo {
      max-width: 80px;
      max-height: 40px;
      object-fit: contain;
    }
    
    .clinic-name {
      font-size: 24px;
      font-weight: 700;
      color: ${primaryColor};
      margin: 0;
    }
    
    .clinic-subtitle {
      font-size: 12px;
      color: #999;
      margin: 4px 0 0 0;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #000;
      border-left: 4px solid ${primaryColor};
      padding-left: 10px;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
      width: 120px;
      min-width: 120px;
    }
    
    .info-value {
      color: #333;
      flex: 1;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: none;
      }
      .page {
        max-width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" class="clinic-logo" alt="Clinic Logo" />` : ''}
      <div>
        <p class="clinic-name">${displayClinicName}</p>
        <p class="clinic-subtitle">Patient Treatment Timeline</p>
      </div>
    </div>

    <!-- Patient Info -->
    <div class="section-title">Patient Information</div>
    <div class="info-row">
      <div class="info-label">Patient Name:</div>
      <div class="info-value">${patientName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Report Date:</div>
      <div class="info-value">${new Date().toLocaleDateString()}</div>
    </div>
    ${dateRange ? `
      <div class="info-row">
        <div class="info-label">Date Range:</div>
        <div class="info-value">${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}</div>
      </div>
    ` : ''}

    <!-- Sessions Summary -->
    <div class="section-title">Treatment Sessions (${filteredSessions.length})</div>
    ${sessionsHTML}

    <!-- Footer -->
    <div class="footer">
      <p>This is an official record from ${displayClinicName}. Confidential.</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Print HTML content as PDF (handles both web and mobile)
 */
export async function printHTMLReport(
  html: string,
  filename: string,
  shouldShare: boolean = false
): Promise<string | void> {
  try {
    // Use expo-print to handle PDF conversion and printing
    const result = await Print.printAsync({
      html,
      printerUrl: undefined, // Uses default printer/print dialog
    });

    if (shouldShare && result) {
      // If print was successful and sharing is requested,
      // navigate to share sheet (handled by native print dialog)
      return result;
    }

    return result;
  } catch (error) {
    console.error('Error printing report:', error);
    throw error;
  }
}

/**
 * Share HTML report as PDF via native share dialog
 */
export async function shareHTMLReportPDF(
  html: string,
  filename: string
): Promise<void> {
  try {
    // Generate PDF using expo-print
    const pdf = await Print.printToFileAsync({
      html,
      base64: false, // Get file URI instead of base64
    });

    // Share the PDF file
    if (pdf && pdf.uri && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdf.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${filename}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    console.error('Error sharing PDF report:', error);
    throw error;
  }
}


export async function saveAndShareReport(
  content: string,
  filename: string,
  shouldShare: boolean = true
): Promise<string> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write report to file
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: 'utf8',
    });

    // Share if requested
    if (shouldShare && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Report',
      });
    }

    return fileUri;
  } catch (error) {
    console.error('Error saving/sharing report:', error);
    throw error;
  }
}

/**
 * Create filename with timestamp
 */
export function createReportFilename(reportType: 'session' | 'timeline', sessionTitle?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitized = sessionTitle ? sessionTitle.replace(/[^a-zA-Z0-9]/g, '') : 'report';
  return `${reportType}_${sanitized}_${timestamp}.txt`;
}

/**
 * Export report as CSV (for Excel)
 */
export async function generateSessionCSV(
  session: PatientSession,
  media: PatientMedia[],
  patientName: string
): Promise<string> {
  const sessionMedia = media.filter(m => session.mediaIds.includes(m.id));

  let csvContent = 'Session Report\n';
  csvContent += `Patient Name,Session Title,Session Date,Image Date,Image Status\n`;

  if (sessionMedia.length === 0) {
    csvContent += `"${patientName}","${session.title}","${new Date(session.date).toLocaleDateString()}","No images","N/A"\n`;
  } else {
    sessionMedia.forEach(img => {
      const imgDate = new Date(img.createdAt).toLocaleDateString();
      const status = img.hasAnnotation ? 'Annotated' : 'Original';
      csvContent += `"${patientName}","${session.title}","${new Date(session.date).toLocaleDateString()}","${imgDate}","${status}"\n`;
    });
  }

  return csvContent;
}

/**
 * Export timeline as CSV
 */
export async function generateTimelineCSV(
  sessions: PatientSession[],
  media: PatientMedia[],
  patientName: string
): Promise<string> {
  let csvContent = 'Treatment Timeline\n';
  csvContent += `Patient Name,Date,Event Type,Description\n`;

  // Combine and sort all events
  const allEvents: Array<{
    date: number;
    type: string;
    description: string;
  }> = [];

  sessions.forEach(session => {
    allEvents.push({
      date: session.date,
      type: 'Session',
      description: session.title
    });
  });

  media.forEach(img => {
    const status = img.hasAnnotation ? 'Annotated Image' : 'Image';
    const sessionInfo = img.sessionId ? ' (in session)' : '';
    allEvents.push({
      date: img.createdAt,
      type: status,
      description: `${status}${sessionInfo}`
    });
  });

  // Sort by date descending
  allEvents.sort((a, b) => b.date - a.date);

  // Write to CSV
  allEvents.forEach(event => {
    const dateStr = new Date(event.date).toLocaleDateString();
    csvContent += `"${patientName}","${dateStr}","${event.type}","${event.description}"\n`;
  });

  return csvContent;
}

/**
 * Fetch saved reports
 */
export async function getSavedReports(): Promise<string[]> {
  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      return [];
    }

    const files = await FileSystem.readDirectoryAsync(docDir);
    return files.filter(f => f.endsWith('.txt') || f.endsWith('.csv'));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

/**
 * Delete a saved report
 */
export async function deleteReport(filename: string): Promise<void> {
  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      throw new Error('Document directory is not available');
    }

    const fileUri = `${docDir}${filename}`;
    await FileSystem.deleteAsync(fileUri);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}
