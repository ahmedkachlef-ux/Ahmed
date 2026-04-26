import { Schema, model, models, Types } from "mongoose";

const PaymentSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    enrollment: { type: Types.ObjectId, ref: "Enrollment" },
    training: { type: Types.ObjectId, ref: "Training" },
    amount: Number,
    currency: { type: String, default: "USD" },
    method: { type: String, enum: ["card", "bank", "voucher", "mock"], default: "mock" },
    status: { type: String, enum: ["pending", "paid", "refunded", "failed"], default: "paid", index: true },
    reference: String
  },
  { timestamps: true }
);

export const Payment = models.Payment || model("Payment", PaymentSchema);
