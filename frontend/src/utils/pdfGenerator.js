import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PERMIT_LABELS = {
  building_permit: 'BUILDING PERMIT',
  electrical_permit: 'ELECTRICAL PERMIT',
  cfei: 'CERTIFICATE OF FINAL ELECTRICAL INSPECTION',
  mechanical_permit: 'MECHANICAL PERMIT',
  sanitary_permit: 'SANITARY/PLUMBING PERMIT',
  fencing_permit: 'FENCING PERMIT',
  demolition_permit: 'DEMOLITION PERMIT'
};

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  scheduled_for_inspection: 'Scheduled for Inspection',
  for_payment: 'For Assessment / Payment',
  approved: 'Approved',
  released: 'Released',
  rejected: 'Rejected',
  returned: 'Returned for Completion'
};

export const generatePermitPDF = (permit) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'legal' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 14;

  // ---- Helpers ----
  const centerText = (text, yPos, size = 10, style = 'normal', color = [0,0,0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    doc.text(String(text), pageW / 2, yPos, { align: 'center' });
  };

  const fieldLine = (label, value, x, yPos, w = 80) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(String(label).toUpperCase() + ':', x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const val = value !== undefined && value !== null && value !== '' ? String(value) : '';
    doc.text(val, x, yPos + 5);
    doc.setDrawColor(200, 200, 200);
    doc.line(x, yPos + 6, x + w, yPos + 6);
  };

  const sectionHeader = (text, yPos, color = [30, 78, 120]) => {
    doc.setFillColor(...color);
    doc.rect(margin, yPos - 4, contentW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin + 3, yPos);
    doc.setTextColor(0, 0, 0);
    return yPos + 9;
  };

  const checkNewPage = (neededSpace = 20) => {
    if (y + neededSpace > pageH - 20) {
      doc.addPage();
      y = 16;
    }
  };

  // ---- HEADER ----
  doc.setFillColor(30, 78, 120);
  doc.rect(0, 0, pageW, 32, 'F');

  // Seal placeholder circle
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 10, 16, 9, 'F');
  doc.setTextColor(30, 78, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SEAL', margin + 10, 14, { align: 'center' });
  doc.text('LGU', margin + 10, 18, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  centerText('Republic of the Philippines', y, 8, 'normal', [255,255,255]);
  centerText('MUNICIPALITY OF BALAGTAS', y + 5, 13, 'bold', [255,255,255]);
  centerText('Province of Bulacan', y + 11, 8, 'normal', [255,255,255]);
  centerText('OFFICE OF THE MUNICIPAL ENGINEER', y + 17, 9, 'bold', [255,220,100]);

  // Right side: ISO / contact
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Municipal Hall, Balagtas, Bulacan 3016', pageW - margin, 12, { align: 'right' });
  doc.text('Tel: (044) 693-XXXX | engineering@balagtas.gov.ph', pageW - margin, 17, { align: 'right' });

  y = 38;
  doc.setTextColor(0, 0, 0);

  // Permit type title
  doc.setFillColor(245, 200, 66);
  doc.rect(margin, y - 3, contentW, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 78, 120);
  doc.text(PERMIT_LABELS[permit.permitType] || 'PERMIT APPLICATION', pageW / 2, y + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 14;

  // Application meta line
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Application No.: `, margin, y);
  doc.setFont('helvetica', 'bold');
  doc.text(permit.transactionNumber || '—', margin + 28, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Filed: ${new Date(permit.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, y);
  doc.text(`Status: ${STATUS_LABELS[permit.status] || permit.status}`, pageW - margin, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ---- SECTION 1: OWNER / APPLICANT ----
  y = sectionHeader('SECTION 1 — OWNER / APPLICANT INFORMATION', y);
  checkNewPage(30);

  fieldLine('Full Name of Owner/Applicant', permit.applicantName, margin, y, contentW);
  y += 12;
  fieldLine('Complete Address', permit.applicantAddress, margin, y, 100);
  fieldLine('Contact No.', permit.contactNumber, margin + 110, y, 72);
  y += 12;
  fieldLine('Email Address', permit.email, margin, y, 100);
  fieldLine('TIN No.', '', margin + 110, y, 72);
  y += 12;
  if (permit.ownerName) {
    fieldLine('Registered Property Owner (if different)', permit.ownerName, margin, y, contentW);
    y += 12;
  }
  y += 4;

  // ---- SECTION 2: PROPERTY LOCATION ----
  checkNewPage(50);
  y = sectionHeader('SECTION 2 — LOCATION OF CONSTRUCTION / PROPERTY', y);

  fieldLine('Lot / Block / Street No.', permit.propertyAddress, margin, y, contentW);
  y += 12;
  fieldLine('Barangay', permit.barangay, margin, y, 60);
  fieldLine('Municipality/City', permit.municipality || 'Balagtas', margin + 70, y, 55);
  fieldLine('Province', permit.province || 'Bulacan', margin + 135, y, 47);
  y += 12;
  fieldLine('Lot No.', permit.lotNumber, margin, y, 40);
  fieldLine('Block No.', permit.blockNumber, margin + 50, y, 40);
  fieldLine('TCT / OCT No.', permit.tctNumber, margin + 100, y, 82);
  y += 12;
  fieldLine('Tax Declaration No.', permit.taxDeclarationNumber, margin, y, 80);
  fieldLine('Zip Code', '3016', margin + 90, y, 35);
  if (permit.latitude && permit.longitude) {
    fieldLine('GPS Coordinates (Lat, Lng)', `${parseFloat(permit.latitude).toFixed(6)}, ${parseFloat(permit.longitude).toFixed(6)}`, margin + 135, y, 47);
  }
  y += 14;

  // ---- SECTION 3: SCOPE OF WORK ----
  checkNewPage(45);
  y = sectionHeader('SECTION 3 — SCOPE OF WORK / USE OF BUILDING', y);

  fieldLine('Scope of Work', permit.scopeOfWork, margin, y, 90);
  fieldLine('Character of Occupancy', permit.useOrCharacterOfOccupancy, margin + 100, y, 82);
  y += 12;
  fieldLine('Floor Area (sq.m)', permit.floorArea, margin, y, 40);
  fieldLine('Lot Area (sq.m)', permit.lotArea, margin + 50, y, 40);
  fieldLine('No. of Storeys', permit.numberOfStoreys, margin + 100, y, 35);
  fieldLine('Height (m)', permit.buildingHeight, margin + 145, y, 37);
  y += 12;
  fieldLine('Total Estimated Cost (PHP)', permit.projectCost ? `₱ ${Number(permit.projectCost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '', margin, y, contentW);
  y += 14;

  // ---- SECTION 4: ELECTRICAL (if applicable) ----
  if (['electrical_permit', 'cfei'].includes(permit.permitType) && (permit.systemCapacity || permit.installedCapacity)) {
    checkNewPage(30);
    y = sectionHeader('SECTION 4 — ELECTRICAL DETAILS', y);
    fieldLine('System Capacity (kVA)', permit.systemCapacity, margin, y, 80);
    fieldLine('Installed Capacity (kVA)', permit.installedCapacity, margin + 90, y, 82);
    y += 14;
  }

  // ---- SECTION 5: DESIGN PROFESSIONAL ----
  checkNewPage(45);
  const sectionNum = ['electrical_permit', 'cfei'].includes(permit.permitType) ? '5' : '4';
  y = sectionHeader(`SECTION ${sectionNum} — DESIGN PROFESSIONAL / ENGINEER-OF-RECORD`, y);

  if (permit.architectEngineerName) {
    fieldLine('Full Name of Architect / Civil Engineer', permit.architectEngineerName, margin, y, 90);
    fieldLine('PRC License No.', permit.architectEngineerLicenseNo, margin + 100, y, 82);
    y += 12;
    fieldLine('PTR No.', permit.architectEngineerPrcNo, margin, y, 55);
    fieldLine('Contact No.', permit.architectEngineerContact, margin + 65, y, 55);
    fieldLine('Date', '', margin + 130, y, 52);
    y += 12;
    fieldLine('Office Address', permit.architectEngineerAddress, margin, y, contentW);
    y += 12;
  }
  if (permit.electricalEngineerName) {
    fieldLine('Electrical Engineer', permit.electricalEngineerName, margin, y, 90);
    fieldLine('EE PRC License No.', permit.electricalEngineerLicenseNo, margin + 100, y, 82);
    y += 12;
  }
  if (permit.sanitaryEngineerName) {
    fieldLine('Sanitary Engineer', permit.sanitaryEngineerName, margin, y, 90);
    y += 12;
  }
  if (permit.mechanicalEngineerName) {
    fieldLine('Mechanical Engineer', permit.mechanicalEngineerName, margin, y, 90);
    y += 12;
  }
  y += 4;

  // ---- SECTION: REQUIREMENTS CHECKLIST ----
  checkNewPage(40);
  const nextSec = parseInt(sectionNum) + 1;
  y = sectionHeader(`SECTION ${nextSec} — DOCUMENTARY REQUIREMENTS CHECKLIST`, y);

  const reqs = getRequirements(permit.permitType);
  const half = Math.ceil(reqs.length / 2);
  const leftReqs = reqs.slice(0, half);
  const rightReqs = reqs.slice(half);
  const maxRows = Math.max(leftReqs.length, rightReqs.length);

  for (let i = 0; i < maxRows; i++) {
    checkNewPage(8);
    if (leftReqs[i]) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(100, 100, 100);
      doc.rect(margin, y - 3, 3, 3);
      doc.text(leftReqs[i], margin + 5, y);
    }
    if (rightReqs[i]) {
      doc.rect(margin + contentW / 2, y - 3, 3, 3);
      doc.text(rightReqs[i], margin + contentW / 2 + 5, y);
    }
    y += 7;
  }
  y += 4;

  // ---- Uploaded Attachments ----
  if (permit.attachments?.length > 0) {
    checkNewPage(20);
    y = sectionHeader('UPLOADED DOCUMENTS', y, [80, 120, 80]);
    permit.attachments.forEach((att, i) => {
      checkNewPage(7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}. ${att.originalName}`, margin + 3, y);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(new Date(att.uploadedAt).toLocaleDateString('en-PH'), pageW - margin, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 6;
    });
    y += 4;
  }

  // ---- STATUS & PAYMENT (if applicable) ----
  if (['for_payment', 'approved', 'released'].includes(permit.status) && permit.assessedFee) {
    checkNewPage(30);
    y = sectionHeader('ASSESSMENT / PAYMENT DETAILS', y, [120, 60, 20]);
    fieldLine('Assessed Fee (PHP)', `₱ ${Number(permit.assessedFee).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, margin, y, 80);
    if (permit.amountPaid) {
      fieldLine('Amount Paid (PHP)', `₱ ${Number(permit.amountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, margin + 90, y, 80);
    }
    y += 12;
    if (permit.orNumber) {
      fieldLine('Official Receipt No.', permit.orNumber, margin, y, 80);
    }
    if (permit.permitNumber) {
      fieldLine('Permit Number Issued', permit.permitNumber, margin + 90, y, 80);
    }
    y += 14;
  }

  // ---- INSPECTION DETAILS (if applicable) ----
  if (permit.status === 'scheduled_for_inspection' && permit.inspectionDate) {
    checkNewPage(30);
    y = sectionHeader('INSPECTION SCHEDULE', y, [91, 33, 182]);
    fieldLine('Inspection Date', new Date(permit.inspectionDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margin, y, 100);
    if (permit.inspectionTime) {
      fieldLine('Inspection Time', permit.inspectionTime, margin + 110, y, 72);
    }
    y += 12;
    if (permit.inspectionTeam) {
      fieldLine('Assigned Inspection Team', permit.inspectionTeam, margin, y, contentW);
      y += 12;
    }
    if (permit.inspectionNotes) {
      fieldLine('Inspection Notes / Instructions', permit.inspectionNotes, margin, y, contentW);
      y += 12;
    }
    y += 4;
  }

  // ---- SIGNATURE BLOCK ----
  const sigY = Math.max(y + 6, pageH - 58);

  // Check if we need a new page for signatures
  if (sigY + 50 > pageH - 10) {
    doc.addPage();
    y = 20;
  } else {
    y = sigY;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Certification text
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  const certText = 'I hereby certify that the above information is true and correct, and that all plans and specifications submitted are in conformance with the provisions of the National Building Code of the Philippines (PD 1096) and its Implementing Rules and Regulations.';
  const certLines = doc.splitTextToSize(certText, contentW);
  doc.text(certLines, margin, y);
  y += certLines.length * 4 + 6;

  // Signature fields
  const sigBoxes = [
    { label: 'Signature over Printed Name of Applicant', sub: `Date: _______________`, x: margin, w: 65 },
    { label: 'Received By', sub: `Date: _______________`, x: margin + 70, w: 55 },
    { label: 'Approved By', sub: `Municipal Engineer\nDate: _______________`, x: margin + 132, w: 60 },
  ];

  sigBoxes.forEach(box => {
    doc.setDrawColor(30, 78, 120);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(box.x, y, box.w, 28, 2, 2, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(box.label, box.x + 2, y + 4);
    doc.setDrawColor(180, 180, 180);
    doc.line(box.x + 3, y + 16, box.x + box.w - 3, y + 16);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 78, 120);
    if (box.label === 'Approved By') {
      doc.text('ENGR. ______________________', box.x + 2, y + 21);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(6);
      doc.text('Municipal Engineer / OIC', box.x + 2, y + 25);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(box.sub, box.x + 2, y + 22);
    }
  });

  y += 36;

  // Footer
  doc.setFillColor(30, 78, 120);
  doc.rect(0, pageH - 12, pageW, 12, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}  |  Balagtas e-Permit System  |  Municipality of Balagtas Engineering Office  |  Transaction: ${permit.transactionNumber}`, pageW / 2, pageH - 5, { align: 'center' });

  doc.save(`${permit.transactionNumber}_${permit.permitType.replace(/_/g, '-')}.pdf`);
};

const getRequirements = (type) => {
  const common = [
    'Duly accomplished application form',
    'Certified true copy of TCT/OCT',
    'Tax Declaration (current)',
    'Real Property Tax Clearance',
    'Lot Plan with vicinity map (duly signed)',
    'Barangay Clearance',
  ];
  const map = {
    building_permit: [
      ...common,
      'Architectural Plans (5 sets, signed & sealed)',
      'Structural Plans & Design Analysis (5 sets)',
      'Electrical Plans (5 sets)',
      'Sanitary/Plumbing Plans (5 sets)',
      'Bill of Materials & Cost Estimate',
      'Project Specifications',
      'Photocopy of PRC ID (Architect/Engineer)',
    ],
    electrical_permit: [
      ...common,
      'Electrical Plans (5 sets, signed & sealed)',
      'Single Line Diagram',
      'Bill of Materials (Electrical)',
      'PRC ID & PTR of Electrical Engineer',
      'Previous Electrical Permit (if renewal)',
    ],
    cfei: [
      'Letter of Request for CFEI',
      'As-Built Electrical Plans (signed & sealed)',
      'PRC ID & PTR of Electrical Engineer',
      'Building Permit (if applicable)',
      'Previous Electrical Permit',
      'Certificate of Completion (if new)',
    ],
    mechanical_permit: [
      ...common,
      'Mechanical Plans (5 sets, signed & sealed)',
      'Equipment Specifications & Brochures',
      'PRC ID & PTR of Mechanical Engineer',
      'Electrical Plans (if relevant)',
    ],
    sanitary_permit: [
      ...common,
      'Sanitary/Plumbing Plans (5 sets, signed & sealed)',
      'PRC ID & PTR of Sanitary Engineer',
      'DENR Clearance (if applicable)',
    ],
    fencing_permit: [
      ...common,
      'Fencing Plan (5 sets)',
      'Material Specifications & Details',
      'Photo of existing property boundary',
    ],
    demolition_permit: [
      ...common,
      'Demolition Plan (5 sets)',
      'Structural Assessment Report',
      'Clearance from neighboring properties',
      'Waste disposal / hauling plan',
    ],
  };
  return map[type] || common;
};
