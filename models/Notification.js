
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "follow_request",
        "new_follower",
        "follow_accepted",
        "like",
        "comment",
        "comment_reply",
      ],
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    follow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Follow",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Efficiently fetch a user's newest notifications.
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

// Efficiently filter unread notifications.
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;