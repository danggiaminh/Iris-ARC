import { supabase } from "@/lib/supabase";
import type React from "react";
import { useState } from "react";

interface LoginPageProps {
	onSwitchToSignup: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showResend, setShowResend] = useState(false);
	const [resendMsg, setResendMsg] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setShowResend(false);
		setResendMsg("");

		if (!EMAIL_REGEX.test(email)) {
			setError("Enter a valid email");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setLoading(true);
		const { error: authError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setLoading(false);

		if (authError) {
			if (authError.message === "Failed to fetch" || authError.message.includes("Load failed")) {
				setError("Network error: Unable to connect to Supabase. Check your connection or Tauri CSP.");
			} else if (authError.message.toLowerCase().includes("email not confirmed")) {
				setError("Please verify your email first");
				setShowResend(true);
			} else if (authError.message.toLowerCase().includes("invalid")) {
				setError("Incorrect email or password");
			} else {
				setError(authError.message);
			}
		}
	};

	const handleResend = async () => {
		setResendMsg("");
		await supabase.auth.resend({ type: "signup", email });
		setResendMsg("Email resent");
	};

	return (
		<div style={styles.wrapper}>
			<div style={styles.card}>
				<div style={styles.logo}>
					<span style={styles.logoIris}>Iris</span>
					<span style={styles.logoArc}>ARC</span>
				</div>
				<div style={styles.heading}>Welcome back</div>
				<div style={styles.sub}>Log in to continue</div>

				<form onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email address"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						style={styles.input}
						onFocus={(e) => {
							e.currentTarget.style.borderColor = "#adb5bd";
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = "#e5e7eb";
						}}
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						style={{ ...styles.input, marginBottom: 16 }}
						onFocus={(e) => {
							e.currentTarget.style.borderColor = "#adb5bd";
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = "#e5e7eb";
						}}
					/>

					{error && <div style={styles.error}>{error}</div>}

					<button type="submit" disabled={loading} style={styles.button}>
						{loading ? "Logging in..." : "Log in"}
					</button>
				</form>

				{showResend && (
					<div style={styles.resendSection}>
						<span style={styles.resendText}>Didn't get the email?</span>
						<button type="button" onClick={handleResend} style={styles.resendButton}>
							Resend verification
						</button>
						{resendMsg && <span style={styles.resendSuccess}>{resendMsg}</span>}
					</div>
				)}

				<div style={styles.switchText}>
					Don't have an account?{" "}
					<button type="button" onClick={onSwitchToSignup} style={styles.switchLink}>
						Sign up
					</button>
				</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	wrapper: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		width: "100%",
		background: "#ffffff",
	},
	card: {
		maxWidth: 400,
		width: "100%",
		padding: 32,
		borderRadius: 16,
		border: "1px solid #e5e7eb",
		boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
		background: "white",
	},
	logo: {
		textAlign: "center" as const,
		fontSize: 20,
		marginBottom: 24,
	},
	logoIris: {
		color: "#1a1a1a",
		fontWeight: 400,
	},
	logoArc: {
		color: "#000000",
		fontWeight: 700,
	},
	heading: {
		fontSize: 18,
		fontWeight: 600,
		color: "#1a1a1a",
		marginBottom: 4,
	},
	sub: {
		fontSize: 13,
		color: "#6b7280",
		marginBottom: 24,
	},
	input: {
		width: "100%",
		border: "1px solid #e5e7eb",
		borderRadius: 8,
		padding: "10px 14px",
		fontSize: 14,
		outline: "none",
		transition: "border 0.15s",
		marginBottom: 12,
		boxSizing: "border-box" as const,
		fontFamily: "inherit",
	},
	error: {
		marginTop: -8,
		marginBottom: 12,
		fontSize: 12,
		color: "#ef4444",
	},
	button: {
		width: "100%",
		background: "#1a1a1a",
		color: "white",
		border: "none",
		borderRadius: 8,
		padding: 11,
		fontSize: 14,
		fontWeight: 500,
		cursor: "pointer",
		transition: "all 0.15s",
		fontFamily: "inherit",
	},
	resendSection: {
		marginTop: 12,
		display: "flex",
		alignItems: "center",
		gap: 6,
		flexWrap: "wrap" as const,
	},
	resendText: {
		fontSize: 12,
		color: "#6b7280",
	},
	resendButton: {
		fontSize: 12,
		color: "#2563eb",
		background: "none",
		border: "none",
		cursor: "pointer",
		fontFamily: "inherit",
		padding: 0,
	},
	resendSuccess: {
		fontSize: 12,
		color: "#22c55e",
	},
	switchText: {
		fontSize: 13,
		color: "#6b7280",
		textAlign: "center" as const,
		marginTop: 20,
	},
	switchLink: {
		color: "#1a1a1a",
		fontWeight: 500,
		cursor: "pointer",
		background: "none",
		border: "none",
		fontSize: 13,
		fontFamily: "inherit",
		padding: 0,
	},
};
