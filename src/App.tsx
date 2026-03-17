import { AuthProvider } from "@/components/AuthProvider";
import { ChatBox } from "@/components/ChatBox";
import { ChatWindow } from "@/components/ChatWindow";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { Attachment } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import { SettingsModal } from "@/components/SettingsModal";
import { SearchModal } from "@/components/SearchModal";
import { LockScreen } from "@/components/LockScreen";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useProfileStore } from "@/stores/profile-store";

const MainChatApp: React.FC = () => {
	const { 
        conversations,
        activeId,
        isStreaming, 
        sendMessage, 
        createNewChat, 
        setActiveChat,
        deleteChat,
        toggleLike,
        loadConversations
    } = useChatStore();
	const { currentModel, setCurrentModel, loadModel } = useSettingsStore();
	const authClear = useAuthStore((s) => s.clear);
	const profile = useProfileStore();

	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [loggingOut, setLoggingOut] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);

	useEffect(() => {
		loadModel();
		profile.loadProfile();
        loadConversations();
	}, [loadModel, profile.loadProfile, loadConversations]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setSearchOpen((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleSend = useCallback(
		(text: string, attachments: Attachment[]) => {
			sendMessage(text, attachments, currentModel);
		},
		[sendMessage, currentModel],
	);

	const handleLogout = async () => {
		setLoggingOut(true);
		await supabase.auth.signOut();
		authClear();
		setLoggingOut(false);
	};
    
    // Derived state for the active conversation
    const activeChat = conversations.find(c => c.id === activeId);
    const messages = activeChat ? activeChat.messages : [];
	const hasMessages = messages.length > 0;

	return (
		<div className={cn("app-root", !sidebarOpen && "sidebar-collapsed")}>
			<aside className="sidebar">
				<div className="sidebar-logo">
					<span className="logo-iris">Iris</span>
					<span className="logo-arc">ARC</span>
				</div>
				<button type="button" className="sidebar-action" onClick={createNewChat} disabled={isStreaming}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="16"></line>
						<line x1="8" y1="12" x2="16" y2="12"></line>
					</svg>
					<span className="action-text">New chat</span>
				</button>
                
                <div className="sidebar-history-list">
                    {conversations.map((chat) => (
                        <div 
                            key={chat.id} 
                            className={cn("sidebar-history-item", activeId === chat.id && "active")}
                            onClick={() => setActiveChat(chat.id)}
                        >
                            <span className="history-item-title">{chat.title}</span>
                            <button 
                                type="button"
                                className="history-item-del-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteChat(chat.id);
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>

				{/* Account Menu */}
				<div className="account-menu-container">
					<button
						type="button"
						className={cn("account-button", showSettingsModal && "active")}
						onClick={() => setShowSettingsModal(true)}
					>
						<div className="account-avatar">
							{profile.avatarBase64 ? (
								<img src={profile.avatarBase64} alt="Avatar" className="w-full h-full object-cover rounded-full" />
							) : (
								profile.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "??"
							)}
						</div>
						<div className="account-info">
							<span className="account-name">{profile.name}</span>
						</div>
					</button>
				</div>
			</aside>
			<div className="main-content">
				<div className="topbar">
					<div className="topbar-left">
						<button
							type="button"
							className="hamburger-button"
							aria-label="Toggle sidebar"
							onClick={() => setSidebarOpen((prev) => !prev)}
						>
							<svg
								aria-hidden="true"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="3" width="6" height="18" rx="1" />
								<rect x="12" y="3" width="9" height="18" rx="1" />
							</svg>
						</button>
						<div className="topbar-title">New chat</div>
					</div>
					<div className="topbar-right">
						<button
							type="button"
							onClick={() => setSearchOpen(true)}
							className="flex items-center gap-1.5 text-[13px] text-gray-500 bg-gray-50/80 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/60 transition-colors shadow-sm cursor-pointer"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
							Search
							<kbd className="ml-1 font-mono text-[10px] bg-white text-gray-400 px-1.5 py-0.5 rounded-md border border-gray-200/60 leading-none shadow-sm">Ctrl K</kbd>
						</button>
					</div>
				</div>
				<div className={cn("content-body", hasMessages ? "docked" : "centered")}>
					{hasMessages && <ChatWindow messages={messages} onToggleLike={toggleLike} />}
					<div className={cn("composer-shell", hasMessages && "docked")}>
						{!hasMessages && <h1 className="welcome-heading">How can I help you today?</h1>}
						<ChatBox
							onSend={handleSend}
							isStreaming={isStreaming}
							currentModel={currentModel}
							onModelChange={setCurrentModel}
						/>
						<div className="mt-4 flex flex-wrap justify-center gap-4 text-[13px] font-medium text-gray-400">
							<span className="cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>/thinking</span>
							<span className="cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>/search</span>
							<span className="cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>/fix</span>
						</div>
					</div>
				</div>
			</div>
			{searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
			{showSettingsModal && (
				<SettingsModal 
					onClose={() => setShowSettingsModal(false)}
					onLogout={handleLogout}
					isLoggingOut={loggingOut}
				/>
			)}
		</div>
	);
};

const App: React.FC = () => {
	const profile = useProfileStore();

	return (
		<AuthProvider>
			<ProtectedRoute>
				{!profile.isUnlocked && profile.isAuthLockEnabled ? (
					<LockScreen onUnlock={(pwd) => {
						if (pwd === profile.localPassword) profile.setUnlocked(true);
						else alert("Incorrect password");
					}} />
				) : (
					<MainChatApp />
				)}
			</ProtectedRoute>
		</AuthProvider>
	);
};

export default App;
