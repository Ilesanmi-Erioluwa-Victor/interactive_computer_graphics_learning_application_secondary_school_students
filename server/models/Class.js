import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Class name is required'], trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    classCode: { type: String, unique: true, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

classSchema.index({ teacher: 1 });

const Class = mongoose.model('Class', classSchema);
export default Class;
