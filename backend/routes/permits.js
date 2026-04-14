const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Permit = require('../models/Permit');
const { protect, adminOnly } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create permit
router.post('/', protect, upload.array('attachments', 20), async (req, res) => {
  try {
    const data = JSON.parse(req.body.permitData || '{}');
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      mimetype: f.mimetype
    }));
    const permit = await Permit.create({
      ...data,
      applicant: req.user._id,
      applicantName: data.applicantName || req.user.fullName,
      email: data.email || req.user.email,
      // Ensure coordinates are stored as numbers
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      attachments,
      statusHistory: [{ status: 'pending', note: 'Application submitted', changedBy: req.user._id }]
    });
    res.status(201).json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's permits
router.get('/my', protect, async (req, res) => {
  try {
    const permits = await Permit.find({ applicant: req.user._id }).sort({ createdAt: -1 });
    res.json(permits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stats (must come before /:id)
router.get('/stats/summary', protect, adminOnly, async (req, res) => {
  try {
    const total = await Permit.countDocuments();
    const pending = await Permit.countDocuments({ status: 'pending' });
    const under_review = await Permit.countDocuments({ status: 'under_review' });
    const scheduled = await Permit.countDocuments({ status: 'scheduled_for_inspection' });
    const approved = await Permit.countDocuments({ status: 'approved' });
    const released = await Permit.countDocuments({ status: 'released' });
    const rejected = await Permit.countDocuments({ status: 'rejected' });
    const revenueResult = await Permit.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]);
    const revenue = revenueResult[0]?.total || 0;
    const byType = await Permit.aggregate([{ $group: { _id: '$permitType', count: { $sum: 1 } } }]);
    const ongoing = pending + under_review + scheduled;
    res.json({ total, pending, under_review, scheduled, approved, released, rejected, revenue, byType, ongoing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all permits (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (type) query.permitType = type;
    if (search) query.$or = [
      { transactionNumber: { $regex: search, $options: 'i' } },
      { applicantName: { $regex: search, $options: 'i' } }
    ];
    const permits = await Permit.find(query)
      .populate('applicant', 'fullName email contactNumber')
      .sort({ createdAt: -1 });
    res.json(permits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single permit
router.get('/:id', protect, async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).populate('applicant', 'fullName email contactNumber');
    if (!permit) return res.status(404).json({ message: 'Permit not found' });
    if (req.user.role !== 'admin' && permit.applicant._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });
    res.json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update permit status (admin)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const {
      status, note, assessedFee, orNumber, amountPaid, permitNumber, rejectionReason,
      inspectionDate, inspectionTime, inspectionNotes, inspectionTeam
    } = req.body;
    const permit = await Permit.findById(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Not found' });

    permit.status = status;
    permit.statusHistory.push({ status, note, changedBy: req.user._id });

    if (assessedFee !== undefined) permit.assessedFee = assessedFee;
    if (orNumber) permit.orNumber = orNumber;
    if (amountPaid !== undefined) permit.amountPaid = amountPaid;
    if (permitNumber) permit.permitNumber = permitNumber;
    if (rejectionReason) permit.rejectionReason = rejectionReason;

    // Inspection fields
    if (status === 'scheduled_for_inspection') {
      if (inspectionDate) permit.inspectionDate = new Date(inspectionDate);
      if (inspectionTime) permit.inspectionTime = inspectionTime;
      if (inspectionNotes) permit.inspectionNotes = inspectionNotes;
      if (inspectionTeam) permit.inspectionTeam = inspectionTeam;
    }

    if (status === 'approved') permit.releaseDate = new Date();

    await permit.save();
    res.json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
