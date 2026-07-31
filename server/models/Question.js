import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    questionText: { type: String, required: [true, 'Question text is required'], trim: true },
    imageUrl: { type: String, default: '' },
    type: {
      type: String,
      enum: ['single-choice', 'multiple-choice', 'true-false'],
      default: 'single-choice',
    },
    options: [
      {
        text: { type: String, required: true, trim: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ quiz: 1, order: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
