const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, subject, body, permitId, parentMessageId } = req.body;
    let threadId = uuidv4();
    if (parentMessageId) {
      const parent = await Message.findById(parentMessageId);
      if (parent) threadId = parent.threadId;
    }
    const msg = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      subject,
      body,
      permit: permitId || null,
      parentMessage: parentMessageId || null,
      threadId
    });
    const populated = await msg.populate(['sender', 'recipient', 'permit']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inbox (latest message per thread)
router.get('/inbox', protect, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id })
      .populate('sender', 'fullName role')
      .populate('permit', 'transactionNumber permitType')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sent
router.get('/sent', protect, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate('recipient', 'fullName role')
      .populate('permit', 'transactionNumber permitType')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get full thread by threadId
router.get('/thread/:threadId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ threadId: req.params.threadId })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .populate('permit', 'transactionNumber permitType')
      .sort({ createdAt: 1 }); // chronological order

    // Verify user is part of this thread
    const isParticipant = messages.some(m =>
      m.sender?._id?.toString() === req.user._id.toString() ||
      m.recipient?._id?.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark thread as read
router.patch('/thread/:threadId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { threadId: req.params.threadId, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin contact
router.get('/admin-contact', protect, async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('_id fullName email');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
