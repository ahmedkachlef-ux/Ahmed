import { Schema, model, models } from "mongoose";

const SessionSchema = new Schema(
  {
    code: String,
    startDate: Date,
    endDate: Date,
    location: String,
    seats: { type: Number, default: 20 },
    enrolled: { type: Number, default: 0 },
    state: { type: String, enum: ["scheduled", "open", "closed", "running", "completed", "cancelled"], default: "open" }
  },
  { _id: true }
);

const TrainingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: String,
    description: String,
    cover: String,
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate", index: true },
    format: { type: String, enum: ["onsite", "online", "hybrid"], default: "online", index: true },
    durationHours: { type: Number, default: 16 },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    trainer: String,
    trainerBio: String,
    outcomes: [String],
    modules: [{ title: String, items: [String] }],
    rating: { type: Number, default: 4.6 },
    ratingsCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    tags: [String],
    sessions: [SessionSchema],
    state: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true }
  },
  { timestamps: true }
);

export const Training = models.Training || model("Training", TrainingSchema);
