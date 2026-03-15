import { isImageMime, isTextMime, sanitizeInput } from "@/lib/helpers";
import { describe, expect, it } from "vitest";

describe("sanitizeInput", () => {
	it("removes control characters", () => {
		expect(sanitizeInput("hello\x00world")).toBe("helloworld");
	});

	it("preserves newlines and tabs", () => {
		expect(sanitizeInput("hello\nworld\ttab")).toBe("hello\nworld\ttab");
	});

	it("limits to 100k characters", () => {
		const long = "a".repeat(200_000);
		expect(sanitizeInput(long).length).toBe(100_000);
	});

	it("preserves normal text", () => {
		expect(sanitizeInput("Hello, World!")).toBe("Hello, World!");
	});

	it("handles empty string", () => {
		expect(sanitizeInput("")).toBe("");
	});
});

describe("isImageMime", () => {
	it("detects image/png", () => {
		expect(isImageMime("image/png")).toBe(true);
	});

	it("detects image/jpeg", () => {
		expect(isImageMime("image/jpeg")).toBe(true);
	});

	it("rejects text/plain", () => {
		expect(isImageMime("text/plain")).toBe(false);
	});

	it("rejects application/pdf", () => {
		expect(isImageMime("application/pdf")).toBe(false);
	});
});

describe("isTextMime", () => {
	it("detects text/plain", () => {
		expect(isTextMime("text/plain")).toBe(true);
	});

	it("detects text/javascript", () => {
		expect(isTextMime("text/javascript")).toBe(true);
	});

	it("detects application/json", () => {
		expect(isTextMime("application/json")).toBe(true);
	});

	it("rejects image/png", () => {
		expect(isTextMime("image/png")).toBe(false);
	});

	it("rejects application/pdf", () => {
		expect(isTextMime("application/pdf")).toBe(false);
	});
});
