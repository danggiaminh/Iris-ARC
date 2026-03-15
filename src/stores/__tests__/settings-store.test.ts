import { DEFAULT_MODEL_ID, STORAGE_KEYS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/settings-store";
import { beforeEach, describe, expect, it } from "vitest";

// Create a simple localStorage mock for tests
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	writable: true,
});

describe("useSettingsStore", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useSettingsStore.setState({
			currentModel: DEFAULT_MODEL_ID,
		});
	});

	it("should have default model set", () => {
		const state = useSettingsStore.getState();
		expect(state.currentModel).toBe(DEFAULT_MODEL_ID);
	});

	it("should switch models and persist", () => {
		useSettingsStore.getState().setCurrentModel("qwen-3-235b-a22b-instruct-2507");

		const state = useSettingsStore.getState();
		expect(state.currentModel).toBe("qwen-3-235b-a22b-instruct-2507");
		expect(localStorageMock.getItem(STORAGE_KEYS.MODEL)).toBe("qwen-3-235b-a22b-instruct-2507");
	});

	it("should load persisted model", () => {
		localStorageMock.setItem(STORAGE_KEYS.MODEL, "qwen-3-235b-a22b-instruct-2507");
		useSettingsStore.getState().loadModel();

		const state = useSettingsStore.getState();
		expect(state.currentModel).toBe("qwen-3-235b-a22b-instruct-2507");
	});
});
