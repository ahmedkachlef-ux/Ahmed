import { Schema, model, models, Types } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    actor: { type: Types.ObjectId, ref: "User", index: true },
    actorRole: String,
    action: { type: String, index: true },
    target: String,
    metadata: Schema.Types.Mixed,
    ip: String
  },
  { timestamps: true }
);

export const ActivityLog = models.ActivityLog || model("ActivityLog", ActivityLogSchema);
