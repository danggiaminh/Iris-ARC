import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "iris-arc-local-key-v1";

export function encrypt(value: string): string {
	return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
	try {
		const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
		return bytes.toString(CryptoJS.enc.Utf8);
	} catch {
		return "";
	}
}
