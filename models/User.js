
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 160,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    postVisibility: {
      type: String,
      enum: ["everyone", "followers", "custom"],
      default: "everyone",
    },

    postAudience: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

const existingUserModel = mongoose.models.User;
if (
  process.env.NODE_ENV !== "production" &&
  existingUserModel &&
  !existingUserModel.schema.path("postVisibility")
) {
  mongoose.deleteModel("User");
}

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;