
import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(72),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
}).strict();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const postSchema = z.object({
  caption: z.string().trim().max(2200).default(""),
  media: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string().min(1),
      type: z.enum(["image", "video"]),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      altText: z.string().max(300).optional(),
    }).strict()
  ).max(10).default([]),
  commentsEnabled: z.boolean().default(true),
  visibility: z.enum(["everyone", "followers", "custom"]).default("everyone"),
  audience: z.array(objectIdSchema).max(1000).default([]),
}).strict().refine(
  (data) => data.caption.length > 0 || data.media.length > 0,
  { message: "Add a caption or media" }
);

export const postSettingsSchema = z.object({
  postVisibility: z.enum(["everyone", "followers", "custom"]),
  postAudience: z.array(objectIdSchema).max(1000),
}).strict();

export const commentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  parentComment: objectIdSchema.nullable().optional(),
}).strict();

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(160).optional(),
  avatar: z.string().url().max(2048).optional(),
  isPrivate: z.boolean().optional(),
}).strict();

export const notificationUpdateSchema = z.object({
  isRead: z.boolean(),
}).strict();

export const followRequestActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
}).strict();