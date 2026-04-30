import mongoose from 'mongoose';

const DailyLogSchema = new mongoose.Schema({
  date: { type: String, required: true },
  endPara: { type: Number, required: true },
  endPage: { type: Number, required: true },
  sajdahsDone: { type: Number, required: true },
}, { timestamps: true });

export const DailyLogModel = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
