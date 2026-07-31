import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Module title is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 20000, default: '' },
    order: { type: Number, default: 0 },
    coverImageUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    isPublished: { type: Boolean, default: false },
    isSequential: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

moduleSchema.index({ order: 1 });
moduleSchema.index({ archived: 1 });

const Module = mongoose.model('Module', moduleSchema);
export default Module;
