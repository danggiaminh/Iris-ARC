export {};

declare global {
	interface Window {
		__chatbox_set_text?: (text: string) => void;
	}
}
