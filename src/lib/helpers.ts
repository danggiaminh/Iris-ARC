/**
 * Sanitize user text input before sending to the API.
 * Strips control characters and limits length.
 */
export function sanitizeInput(input: string): string {
	// Remove null bytes and other control characters (except newline/tab)
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional sanitization
	const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
	// Limit to 100k characters to prevent abuse
	return cleaned.slice(0, 100_000);
}

/**
 * Check if a MIME type represents an image file.
 */
export function isImageMime(mime: string): boolean {
	return mime.startsWith("image/");
}

/**
 * Check if a MIME type represents a PDF file.
 */
export function isPdfMime(mime: string): boolean {
	return mime === "application/pdf";
}

/**
 * Check if a MIME type represents a text/code file.
 */
export function isTextMime(mime: string): boolean {
	return (
		mime.startsWith("text/") ||
		mime === "application/json" ||
		mime === "application/javascript" ||
		mime === "application/xml" ||
		mime === "application/x-sh" ||
		mime === "application/x-python" ||
		mime === "application/typescript"
	);
}

/**
 * Read a File as a base64 data URL.
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Read a File as text.
 */
export function fileToText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

/**
 * Extract the base64 payload from a data URL.
 */
export function extractBase64(dataUrl: string): string {
	const commaIndex = dataUrl.indexOf(",");
	return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}
