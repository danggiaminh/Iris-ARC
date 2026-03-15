import type React from "react";
import { useState } from "react";

interface LockScreenProps {
	onUnlock: (password: string) => void;
	errorMsg?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, errorMsg }) => {
	const [password, setPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onUnlock(password);
	};

	return (
		<div className="lockscreen-overlay">
			<div className="lockscreen-card">
				<div className="lockscreen-logo">
					<span className="logo-iris">Iris</span>
					<span className="logo-arc">ARC</span>
				</div>
				<h2 className="lockscreen-title">Authentication Required</h2>
				<p className="lockscreen-desc">Enter your password to unlock the application.</p>
				
				<form onSubmit={handleSubmit} className="lockscreen-form">
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="lockscreen-input"
						autoFocus
					/>
					{errorMsg && <p className="lockscreen-error">{errorMsg}</p>}
					<button type="submit" className="lockscreen-button">
						Unlock
					</button>
				</form>
			</div>
		</div>
	);
};
