import { Camera, LogOut, Shield, User } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
	onClose: () => void;
	onLogout: () => void;
	isLoggingOut: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLogout, isLoggingOut }) => {
	const profile = useProfileStore();
	const [activeTab, setActiveTab] = useState<"customize" | "security">("customize");

	// Form State
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState(profile.name);
	const [birthday, setBirthday] = useState(profile.birthday);
	const [location, setLocation] = useState(profile.location);
	const [password, setPassword] = useState(profile.localPassword || "");
	const [authLock, setAuthLock] = useState(profile.isAuthLockEnabled);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			profile.setAvatar(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const saveProfile = () => {
		profile.setName(name);
		profile.setBirthday(birthday);
		profile.setLocation(location);
	};

	const saveSecurity = () => {
		profile.setPassword(password || null);
		profile.setAuthLockEnabled(authLock && !!password);
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-container" onClick={(e) => e.stopPropagation()}>
				<div className="modal-sidebar">
					<h2 className="modal-title">Settings</h2>
					<nav className="modal-nav">
						<button 
							type="button" 
							className={cn("modal-nav-item", activeTab === "customize" && "active")}
							onClick={() => setActiveTab("customize")}
						>
							<User size={16} /> Customize
						</button>
						<button 
							type="button" 
							className={cn("modal-nav-item", activeTab === "security" && "active")}
							onClick={() => setActiveTab("security")}
						>
							<Shield size={16} /> Security
						</button>
					</nav>
					<button type="button" className="modal-logout-btn" onClick={onLogout} disabled={isLoggingOut}>
						<LogOut size={16} /> {isLoggingOut ? "Logging out..." : "Log out"}
					</button>
				</div>
				<div className="modal-content-area">
					<button type="button" className="modal-close-btn" onClick={onClose}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</button>
					
					{activeTab === "customize" && (
						<div className="modal-section-animate">
							<h3 className="modal-section-title">Customize Profile</h3>
							<div className="modal-form">
								<div className="modal-avatar-section">
									<div className="modal-avatar-preview" onClick={() => fileInputRef.current?.click()}>
										{profile.avatarBase64 ? (
											<img src={profile.avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
										) : (
											<Camera className="text-gray-400" size={24} />
										)}
										<div className="modal-avatar-overlay">Change</div>
									</div>
									<input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" hidden />
									<div>
										<h4 className="font-medium text-[15px]">Profile Picture</h4>
										<p className="text-[13px] text-gray-500">PNG, JPG or WEBP. Max 5MB.</p>
									</div>
								</div>

								<div className="modal-input-group">
									<label>Display Name</label>
									<input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveProfile} placeholder="Your name" />
								</div>
								<div className="modal-input-group">
									<label>Birthday</label>
									<input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} onBlur={saveProfile} />
								</div>
								<div className="modal-input-group">
									<label>Location</label>
									<input type="text" value={location} onChange={(e) => setLocation(e.target.value)} onBlur={saveProfile} placeholder="e.g. Earth" />
								</div>
							</div>
						</div>
					)}



					{activeTab === "security" && (
						<div className="modal-section-animate">
							<h3 className="modal-section-title">Security</h3>
							<div className="modal-form">
								<div className="modal-input-group">
									<label>Local Password</label>
									<input 
										type="password" 
										value={password} 
										onChange={(e) => setPassword(e.target.value)} 
										onBlur={saveSecurity}
										placeholder="Enter a password to lock app" 
									/>
									<p className="text-[13px] text-gray-500 mt-1">Used only for local authentication lock.</p>
								</div>

								<div className="modal-switch-row">
									<div>
										<h4 className="font-medium text-[14px]">Auth Lock</h4>
										<p className="text-[13px] text-gray-500">Require password when launching the app.</p>
									</div>
									<label className="toggle-switch">
										<input 
											type="checkbox" 
											checked={authLock}
											onChange={(e) => {
												setAuthLock(e.target.checked);
												// Automatically save security toggle
												profile.setAuthLockEnabled(e.target.checked && !!password);
											}}
											disabled={!password}
										/>
										<span className="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
