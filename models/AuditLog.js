const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    actorType: {
      type: String,
      enum: ['user', 'worker', 'admin', 'unknown'],
      default: 'unknown'
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    targetType: {
      type: String,
      trim: true
    },
    targetId: {
      type: String,
      trim: true
    },
    meta: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

