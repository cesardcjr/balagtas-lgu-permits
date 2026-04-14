const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const permitSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true },
  permitType: {
    type: String,
    required: true,
    enum: ['building_permit', 'electrical_permit', 'cfei', 'mechanical_permit', 'sanitary_permit', 'fencing_permit', 'demolition_permit']
  },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Applicant Info
  applicantName: { type: String, required: true },
  applicantAddress: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },

  // Property Info
  propertyAddress: { type: String, required: true },
  lotNumber: String,
  blockNumber: String,
  tctNumber: String,
  taxDeclarationNumber: String,
  barangay: String,
  municipality: { type: String, default: 'Balagtas' },
  province: { type: String, default: 'Bulacan' },

  // Location Coordinates (part of application properties)
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },

  // Construction Details
  scopeOfWork: String,
  useOrCharacterOfOccupancy: String,
  projectCost: Number,
  floorArea: Number,
  numberOfStoreys: Number,
  totalFloorArea: Number,
  buildingHeight: Number,
  lotArea: Number,

  // Electrical
  systemCapacity: String,
  installedCapacity: String,

  // Design Professionals
  architectEngineerName: String,
  architectEngineerLicenseNo: String,
  architectEngineerPrcNo: String,
  architectEngineerAddress: String,
  architectEngineerContact: String,
  electricalEngineerName: String,
  electricalEngineerLicenseNo: String,
  sanitaryEngineerName: String,
  mechanicalEngineerName: String,
  civilEngineerName: String,

  // Owner
  ownerName: String,
  ownerAddress: String,

  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Status — includes scheduled_for_inspection
  status: {
    type: String,
    enum: ['pending', 'under_review', 'scheduled_for_inspection', 'for_payment', 'approved', 'released', 'rejected', 'returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],

  // Inspection scheduling
  inspectionDate: { type: Date, default: null },
  inspectionTime: { type: String, default: null },
  inspectionNotes: { type: String, default: null },
  inspectionTeam: { type: String, default: null },

  // Assessment / payment
  adminNotes: String,
  rejectionReason: String,
  assessedFee: Number,
  orNumber: String,
  amountPaid: Number,
  datePaid: Date,
  releaseDate: Date,
  permitNumber: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PREFIXES = {
  building_permit: 'BP',
  electrical_permit: 'EP',
  cfei: 'CFEI',
  mechanical_permit: 'MP',
  sanitary_permit: 'SP',
  fencing_permit: 'FP',
  demolition_permit: 'DP'
};

permitSchema.pre('save', async function (next) {
  if (!this.transactionNumber) {
    const prefix = PREFIXES[this.permitType] || 'PRM';
    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.transactionNumber = `${prefix}-${String(counter.seq).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Permit', permitSchema);
