import {
	apiKeySchema,
	chatMessageSchema,
	fileAttachmentSchema,
	modelInfoSchema,
	sendMessageRequestSchema,
	streamChunkSchema,
	streamErrorSchema,
} from "@/lib/schemas";
import { describe, expect, it } from "vitest";

describe("Zod Schemas", () => {
	describe("chatMessageSchema", () => {
		it("accepts valid string content", () => {
			const result = chatMessageSchema.safeParse({
				role: "user",
				content: "Hello world",
			});
			expect(result.success).toBe(true);
		});

		it("accepts valid array content", () => {
			const result = chatMessageSchema.safeParse({
				role: "assistant",
				content: [{ type: "text", text: "Hello" }],
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid role", () => {
			const result = chatMessageSchema.safeParse({
				role: "invalid",
				content: "Hello",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("fileAttachmentSchema", () => {
		it("accepts valid image attachment", () => {
			const result = fileAttachmentSchema.safeParse({
				filename: "photo.png",
				mime_type: "image/png",
				data: "data:image/png;base64,iVBOR...",
				is_image: true,
			});
			expect(result.success).toBe(true);
		});

		it("accepts valid text attachment", () => {
			const result = fileAttachmentSchema.safeParse({
				filename: "code.rs",
				mime_type: "text/plain",
				data: "fn main() {}",
				is_image: false,
			});
			expect(result.success).toBe(true);
		});

		it("rejects empty filename", () => {
			const result = fileAttachmentSchema.safeParse({
				filename: "",
				mime_type: "text/plain",
				data: "content",
				is_image: false,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("streamChunkSchema", () => {
		it("accepts valid chunk", () => {
			const result = streamChunkSchema.safeParse({
				content: "Hello",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("streamErrorSchema", () => {
		it("accepts valid error", () => {
			const result = streamErrorSchema.safeParse({
				error: "Rate limited",
				code: 429,
			});
			expect(result.success).toBe(true);
		});

		it("rejects missing fields", () => {
			const result = streamErrorSchema.safeParse({
				error: "Something",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("sendMessageRequestSchema", () => {
		it("accepts valid request without attachments", () => {
			const result = sendMessageRequestSchema.safeParse({
				messages: [{ role: "user", content: "Hello" }],
				model: "qwen-3-235b-a22b-instruct-2507",
			});
			expect(result.success).toBe(true);
		});

		it("accepts valid request with attachments", () => {
			const result = sendMessageRequestSchema.safeParse({
				messages: [{ role: "user", content: "Look at this" }],
				model: "qwen-3-235b-a22b-instruct-2507",
				attachments: [
					{
						filename: "test.txt",
						mime_type: "text/plain",
						data: "hello",
						is_image: false,
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("rejects empty model", () => {
			const result = sendMessageRequestSchema.safeParse({
				messages: [{ role: "user", content: "Hello" }],
				model: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("modelInfoSchema", () => {
		it("accepts valid model info", () => {
			const result = modelInfoSchema.safeParse({
				id: "qwen-3-235b-a22b-instruct-2507",
				display_name: "Phosphorate",
				provider: "core",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("apiKeySchema", () => {
		it("accepts valid API key", () => {
			const result = apiKeySchema.safeParse("test-key");
			expect(result.success).toBe(true);
		});

		it("rejects empty key", () => {
			const result = apiKeySchema.safeParse("");
			expect(result.success).toBe(false);
		});

	});
});
