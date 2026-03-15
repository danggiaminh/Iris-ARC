import { z } from "zod";

// --- Chat Messages ---

export const chatMessageSchema = z.object({
	role: z.enum(["user", "assistant", "system"]),
	content: z.union([z.string(), z.array(z.record(z.unknown()))]),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// --- File Attachments ---

export const fileAttachmentSchema = z.object({
	filename: z.string().min(1),
	mime_type: z.string().min(1),
	data: z.string(),
	is_image: z.boolean(),
});

export type FileAttachment = z.infer<typeof fileAttachmentSchema>;

// --- Stream Payloads ---

export const streamChunkSchema = z.object({
	content: z.string(),
});

export type StreamChunkPayload = z.infer<typeof streamChunkSchema>;

export const streamErrorSchema = z.object({
	error: z.string(),
	code: z.number(),
});

export type StreamErrorPayload = z.infer<typeof streamErrorSchema>;

// --- Send Message Request ---

export const sendMessageRequestSchema = z.object({
	messages: z.array(chatMessageSchema),
	model: z.string().min(1),
	attachments: z.array(fileAttachmentSchema).optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

// --- Model Info ---

export const modelInfoSchema = z.object({
	id: z.string().min(1),
	display_name: z.string().min(1),
	description: z.string().optional(),
	provider: z.string().min(1),
});

export type ModelInfo = z.infer<typeof modelInfoSchema>;

// --- API Key ---

export const apiKeySchema = z.string().min(1, "API key is required");

// --- UI Message ---

export const uiMessageSchema = z.object({
	id: z.string().uuid(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
	attachments: z.array(z.unknown()).optional(),
	timestamp: z.number(),
	isStreaming: z.boolean().optional(),
	isLiked: z.boolean().optional(),
	isDisliked: z.boolean().optional(),
	error: z.string().optional(),
});

export type UIMessage = z.infer<typeof uiMessageSchema>;

// --- Attachment (UI) ---

export interface Attachment {
	id: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
	base64DataUrl: string;
	objectUrl: string;
	isImage: boolean;
	textContent?: string;
}
