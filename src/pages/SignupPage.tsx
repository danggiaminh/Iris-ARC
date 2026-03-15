import { supabase } from "@/lib/supabase";
import type React from "react";
import { useState } from "react";

interface SignupPageProps {
	onSwitchToLogin: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!EMAIL_REGEX.test(email)) {
			setError("Enter a valid email");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		const { error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: window.location.origin,
			},
		});
		setLoading(false);

		if (authError) {
			if (authError.message === "Failed to fetch" || authError.message.includes("Load failed")) {
				setError("Network error: Unable to connect to Supabase. Check your connection or Tauri CSP.");
			} else {
				setError(authError.message);
			}
		} else {
			setSuccess(true);
		}
	};

	if (success) {
		return (
			<div style={styles.wrapper}>
				<div style={styles.card}>
					<div style={styles.logo}>
						<span style={styles.logoIris}>Iris</span>
						<span style={styles.logoArc}>ARC</span>
					</div>
					<div style={styles.successCenter}>
						<svg
							aria-hidden="true"
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#22c55e"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M9 12l2 2 4-4" />
						</svg>
						<div style={styles.successHeading}>Check your email</div>
						<div style={styles.successSub}>
							We sent a verification link to {email}. Click it to activate your account.
						</div>
					</div>
					<div style={styles.switchText}>
						<button type="button" onClick={onSwitchToLogin} style={styles.switchLink}>
							Back to login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={styles.wrapper}>
			<div style={styles.card}>
				<div style={styles.logo}>
					<span style={styles.logoIris}>Iris</span>
					<span style={styles.logoArc}>ARC</span>
				</div>
				<div style={styles.heading}>Create account</div>
				<div style={styles.sub}>Sign up to get started</div>

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
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
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
						{loading ? "Creating account..." : "Create account"}
					</button>
				</form>

				<div style={styles.switchText}>
					Already have an account?{" "}
					<button type="button" onClick={onSwitchToLogin} style={styles.switchLink}>
						Log in
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
	successCenter: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		gap: 12,
		marginBottom: 20,
	},
	successHeading: {
		fontSize: 16,
		fontWeight: 600,
		color: "#1a1a1a",
	},
	successSub: {
		fontSize: 13,
		color: "#6b7280",
		textAlign: "center" as const,
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
