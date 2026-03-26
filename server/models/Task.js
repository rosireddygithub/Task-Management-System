const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: { type: Date },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  estimatedTime: { type: Number, default: 0 }, // in hours
  actualTime: { type: Number, default: 0 }, // in hours
  progress: { type: Number, default: 0 }, // 0 to 100 percentage
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
