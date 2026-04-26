import { Schema, model, models, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", index: true },
    audience: { type: String, enum: ["user", "admin", "super_admin", "all"], default: "user", index: true },
    title: String,
    message: String,
    type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
    read: { type: Boolean, default: false },
    link: String
  },
  { timestamps: true }
);

export const Notification = models.Notification || model("Notification", NotificationSchema);
