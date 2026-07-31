import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    timeSpentSeconds: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, lesson: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
