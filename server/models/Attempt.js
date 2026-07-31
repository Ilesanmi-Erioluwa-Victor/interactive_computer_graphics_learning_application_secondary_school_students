import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOptions: [{ type: String }],
      },
    ],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    optionOrder: { type: Map, of: [String], default: {} },
  },
  { timestamps: true }
);

attemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 }, { unique: true });

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
