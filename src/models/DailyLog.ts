import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  date: { type: String, required: true },
  parasRead: { type: Number, required: true },
  pagesRead: { type: Number, required: true },
  sajdahsDone: { type: Number, required: true },
}, { timestamps: true });

export const DailyLogModel = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
