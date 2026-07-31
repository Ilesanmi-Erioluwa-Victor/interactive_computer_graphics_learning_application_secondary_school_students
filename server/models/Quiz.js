import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    title: { type: String, required: [true, 'Quiz title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    timeLimitMinutes: { type: Number, default: 0, min: 0 },
    passMarkPercent: { type: Number, default: 50, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 3, min: 1, max: 20 },
    shuffleQuestions: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizSchema.index({ module: 1 });
quizSchema.index({ archived: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
