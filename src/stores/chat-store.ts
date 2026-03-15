import { extractBase64, isPdfMime, sanitizeInput } from "@/lib/helpers";
import type { Attachment, UIMessage } from "@/lib/schemas";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const LOCAL_API_URL = import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:3000";

export interface Conversation {
	id: string;
	title: string;
	messages: UIMessage[];
	created_at: number;
}

interface ChatState {
    conversations: Conversation[];
    activeId: string | null;
	isStreaming: boolean;
}

interface ChatActions {
	sendMessage: (text: string, attachments: Attachment[], model: string) => void;
	createNewChat: () => void;
	retryMessage: (messageId: string, model: string) => void;
	toggleLike: (messageId: string) => void;
    setActiveChat: (id: string) => void;
    deleteChat: (id: string) => void;
    loadConversations: () => void;
}

type ApiContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

type ApiMessage = {
	role: "user" | "assistant" | "system";
	content: string | ApiContentPart[];
};

interface ChatCompletionResponse {
	choices?: Array<{ message?: { content?: string } }>;
	error?: { message?: string };
}

function mapStatusToMessage(status: number): string {
	switch (status) {
		case 401:
			return "Invalid API key";
		case 429:
			return "Rate limit reached";
		case 500:
			return "Server error, try again";
		default:
			return "Server error, try again";
	}
}

function buildMessageContent(message: UIMessage): string | ApiContentPart[] {
	const attachments = (message.attachments ?? []) as Attachment[];
	if (message.role !== "user" || attachments.length === 0) {
		return message.content;
	}

	const parts: ApiContentPart[] = [];
	parts.push({ type: "text", text: message.content });

	for (const attachment of attachments) {
		if (attachment.isImage) {
			parts.push({
				type: "image_url",
				image_url: { url: attachment.base64DataUrl },
			});
			continue;
		}

		if (isPdfMime(attachment.mimeType)) {
			const base64 = extractBase64(attachment.base64DataUrl);
			parts.push({
				type: "text",
				text: `[File: ${attachment.name}]\n${base64}`,
			});
			continue;
		}

		parts.push({
			type: "text",
			text: `[File: ${attachment.name}]\n${attachment.textContent ?? ""}`,
		});
	}

	return parts;
}

function buildApiMessages(history: UIMessage[]): ApiMessage[] {
	return history.map((message) => ({
		role: message.role,
		content: buildMessageContent(message),
	}));
}

import { MODEL_MAP } from "@/lib/constants";

async function requestCompletion(model: string, messages: ApiMessage[]): Promise<string> {
	const backendModel = MODEL_MAP[model] || model;
    
	const response = await fetch(`${LOCAL_API_URL}/api/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: backendModel,
			messages,
			stream: false,
		}),
	});

	if (!response.ok) {
		throw new Error(mapStatusToMessage(response.status));
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content;
	if (!content || typeof content !== "string") {
		throw new Error(data.error?.message ?? "Server error, try again");
	}

	return content;
}

const STORAGE_KEYS = {
    CONVERSATIONS: "irisarc_conversations",
} as const;

function saveState(state: Partial<ChatState>) {
    if (state.conversations) {
        try {
            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.conversations));
        } catch (e) {
            console.error("Failed to save conversations", e);
        }
    }
}

export const useChatStore = create<ChatState & ChatActions>()(
	immer((set, get) => ({
		conversations: [],
        activeId: null,
		isStreaming: false,

        loadConversations: () => {
            const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as Conversation[];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const first = parsed[0];
                        if (first) {
                            set({ conversations: parsed, activeId: first.id });
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse conversations storage", e);
                }
            }
            // If none, auto create first chat
            get().createNewChat();
        },

        createNewChat: () => {
            if (get().isStreaming) return;
            const newChat: Conversation = {
                id: uuidv4(),
                title: "New Chat",
                messages: [],
                created_at: Date.now()
            };
            set((s) => {
                s.conversations.unshift(newChat); // Put at top
                s.activeId = newChat.id;
            });
            saveState({ conversations: get().conversations });
        },

        setActiveChat: (id: string) => {
            if (get().isStreaming) return;
            set((s) => { s.activeId = id; });
        },

        deleteChat: (id: string) => {
            if (get().isStreaming) return;
            set((s) => {
                const idx = s.conversations.findIndex((c) => c.id === id);
                if (idx !== -1) {
                    s.conversations.splice(idx, 1);
                    if (s.activeId === id) {
                        const head = s.conversations[0];
                        s.activeId = s.conversations.length > 0 && head ? head.id : null;
                    }
                    if (s.conversations.length === 0) {
                        // Avoid empty state, create a new one inside mutation block carefully
                        // Or let the component handle it... Actually better to just spawn it here.
                        const newChat: Conversation = {
                            id: uuidv4(),
                            title: "New Chat",
                            messages: [],
                            created_at: Date.now()
                        };
                        s.conversations.push(newChat);
                        s.activeId = newChat.id;
                    }
                }
            });
            saveState({ conversations: get().conversations });
        },

		sendMessage: (text: string, attachments: Attachment[], model: string) => {
			const state = get();
			if (state.isStreaming || !state.activeId) return;

			const sanitized = sanitizeInput(text);
			if (!sanitized.trim()) return;

            const activeChatIdx = state.conversations.findIndex(c => c.id === state.activeId);
            if (activeChatIdx === -1) return;
            const targetChat = state.conversations[activeChatIdx];
            if (!targetChat) return;

			const userId = uuidv4();
			const assistantId = uuidv4();
			const now = Date.now();

			const userMessage: UIMessage = {
				id: userId,
				role: "user",
				content: sanitized,
				attachments: attachments.length > 0 ? attachments : undefined,
				timestamp: now,
			};

			const assistantMessage: UIMessage = {
				id: assistantId,
				role: "assistant",
				content: "",
				timestamp: now,
				isStreaming: true,
			};

			const history = [...targetChat.messages, userMessage];

			set((s) => {
                const chat = s.conversations.find((c) => c.id === s.activeId);
                if (chat) {
				    chat.messages.push(userMessage, assistantMessage);
                    if (chat.title === "New Chat") {
                        // Truncate first message to max 30 chars for title
                        chat.title = sanitized.length > 30 ? sanitized.substring(0, 30) + "..." : sanitized;
                    }
                }
				s.isStreaming = true;
			});
            saveState({ conversations: get().conversations });

			const apiMessages = buildApiMessages(history);

			void (async () => {
				try {
					const content = await requestCompletion(model, apiMessages);
					set((s) => {
                        const chat = s.conversations.find((c) => c.id === s.activeId);
                        if (!chat) return;
						const msg = chat.messages.find((m) => m.id === assistantId);
						if (msg) {
							msg.content = content;
							msg.isStreaming = false;
						}
						s.isStreaming = false;
					});
                    saveState({ conversations: get().conversations });
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					set((s) => {
                        const chat = s.conversations.find((c) => c.id === s.activeId);
                        if (!chat) return;
						const msg = chat.messages.find((m) => m.id === assistantId);
						if (msg) {
							msg.content = errorMsg;
							msg.error = errorMsg;
							msg.isStreaming = false;
						}
						s.isStreaming = false;
					});
                    saveState({ conversations: get().conversations });
				}
			})();
		},

		retryMessage: (messageId: string, model: string) => {
			const state = get();
			if (state.isStreaming || !state.activeId) return;

            const activeChatIdx = state.conversations.findIndex(c => c.id === state.activeId);
            if (activeChatIdx === -1) return;
            const chatObj = state.conversations[activeChatIdx];
            if (!chatObj) return;

			const idx = chatObj.messages.findIndex((m) => m.id === messageId);
			if (idx < 0) return;

			let userIdx = -1;
			for (let i = idx - 1; i >= 0; i--) {
				if (chatObj.messages[i]?.role === "user") {
					userIdx = i;
					break;
				}
			}
			if (userIdx < 0) return;

			const userMessage = chatObj.messages[userIdx];
			if (!userMessage) return;

			const assistantId = uuidv4();
			const assistantMessage: UIMessage = {
				id: assistantId,
				role: "assistant",
				content: "",
				timestamp: Date.now(),
				isStreaming: true,
			};

			const history = chatObj.messages.slice(0, userIdx + 1);

			set((s) => {
                const chat = s.conversations.find((c) => c.id === s.activeId);
                if (chat) {
				    chat.messages = [...history, assistantMessage];
                }
				s.isStreaming = true;
			});
            saveState({ conversations: get().conversations });

			const apiMessages = buildApiMessages(history);

			void (async () => {
				try {
					const content = await requestCompletion(model, apiMessages);
					set((s) => {
                        const c = s.conversations.find((x) => x.id === s.activeId);
                        if (!c) return;
						const msg = c.messages.find((m) => m.id === assistantId);
						if (msg) {
							msg.content = content;
							msg.isStreaming = false;
						}
						s.isStreaming = false;
					});
                    saveState({ conversations: get().conversations });
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					set((s) => {
                        const c = s.conversations.find((x) => x.id === s.activeId);
                        if (!c) return;
						const msg = c.messages.find((m) => m.id === assistantId);
						if (msg) {
							msg.content = errorMsg;
							msg.error = errorMsg;
							msg.isStreaming = false;
						}
						s.isStreaming = false;
					});
                    saveState({ conversations: get().conversations });
				}
			})();
		},

		toggleLike: (messageId: string) => {
			set((s) => {
                const chat = s.conversations.find((c) => c.id === s.activeId);
                if (!chat) return;
				const msg = chat.messages.find((m) => m.id === messageId && m.role === "assistant");
				if (msg) {
					msg.isLiked = !msg.isLiked;
				}
			});
            saveState({ conversations: get().conversations });
		},
	})),
);
