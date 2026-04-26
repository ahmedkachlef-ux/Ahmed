import { Schema, model, models, Types } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    training: { type: Types.ObjectId, ref: "Training", required: true, index: true },
    sessionId: { type: Types.ObjectId },
    status: { type: String, enum: ["requested", "accepted", "rejected", "completed", "cancelled"], default: "requested", index: true },
    progress: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paymentRef: String,
    note: String
  },
  { timestamps: true }
);

export const Enrollment = models.Enrollment || model("Enrollment", EnrollmentSchema);
