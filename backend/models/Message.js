const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  permit: { type: mongoose.Schema.Types.ObjectId, ref: 'Permit' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  attachments: [{
    filename: String,
    originalName: String,
    path: String
  }],
  threadId: String,
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
