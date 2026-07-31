import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['lesson', 'quiz', 'general'], default: 'general' },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    message: { type: String, required: [true, 'Feedback message is required'], trim: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5, default: null },
    response: { type: String, trim: true, maxlength: 2000, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ targetType: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
