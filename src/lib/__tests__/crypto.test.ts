import { decrypt, encrypt } from "@/lib/crypto";
import { describe, expect, it } from "vitest";

describe("crypto", () => {
	it("encrypts and decrypts correctly", () => {
		const original = "sk-or-v1-my-secret-key";
		const encrypted = encrypt(original);
		expect(encrypted).not.toBe(original);
		expect(encrypted.length).toBeGreaterThan(0);
		const decrypted = decrypt(encrypted);
		expect(decrypted).toBe(original);
	});

	it("produces different ciphertext for different inputs", () => {
		const a = encrypt("sk-key-a");
		const b = encrypt("sk-key-b");
		expect(a).not.toBe(b);
	});

	it("decrypts empty string for wrong ciphertext", () => {
		const result = decrypt("not-valid-ciphertext");
		// CryptoJS returns empty string on decrypt failure
		expect(result).toBe("");
	});
});
