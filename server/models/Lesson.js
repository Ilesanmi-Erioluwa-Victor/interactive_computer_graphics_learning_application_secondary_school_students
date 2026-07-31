import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: [true, 'Lesson title is required'], trim: true, maxlength: 200 },
    content: { type: String, default: '' },
    mediaAssets: [
      {
        type: { type: String, enum: ['image', 'video', 'diagram'], default: 'image' },
        url: { type: String, required: true },
        caption: { type: String, default: '' },
      },
    ],
    interactiveType: {
      type: String,
      enum: ['none', 'canvas-shapes', 'canvas-color', 'canvas-transform'],
      default: 'none',
    },
    interactiveConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    estimatedMinutes: { type: Number, default: 10, min: 1, max: 480 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ archived: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
