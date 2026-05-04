import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  date: { type: String, required: true },
  endPara: { type: Number, required: true },
  endPage: { type: Number, required: true },
  sajdahsDone: { type: Number, required: true },
  loggedAt: { type: String },
}, { timestamps: true });

export const DailyLogModel = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
