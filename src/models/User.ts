import { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    recordId: { type: String, index: true },
    fullName: { type: String, required: true },
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other", "unspecified"], default: "unspecified" },
    company: String,
    department: String,
    role: { type: String, enum: ["user", "admin", "super_admin"], default: "user", index: true },
    status: { type: String, enum: ["active", "pending", "suspended"], default: "active", index: true },
    active: { type: Boolean, default: true },
    address: String,
    avatar: { type: String, default: "" },
    profilePicture: String,
    passwordHash: String,
    authProvider: { type: String, enum: ["password", "google", "facebook", "yahoo"], default: "password" },
    emailVerified: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    focusTracks: [{ type: String }],
    interests: [{ type: String }],
    language: { type: String, enum: ["en", "fr", "ar"], default: "en" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    lastLogin: Date,
    verificationToken: String
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: any };
export const User = models.User || model("User", UserSchema);
