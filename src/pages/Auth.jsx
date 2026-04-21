import React, { useState, useEffect, useCallback } from "react";
import { useSignIn, useSignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import googleIcon from "../assets/Google.png";
import facebookIcon from "../assets/facebook.png";
import appleIcon from "../assets/icloud.png";
import { getImageUrl } from "../utils/imageUtils";

// ─── Validation helpers ────────────────────────────────────────────────────
const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validatePassword = (password) => password.length >= 8;

const validateName = (name) =>
  name.trim().length >= 2 && name.trim().length <= 50;

// Safe, generic messages that don't reveal system state (prevents user enumeration)
const SAFE_AUTH_ERROR =
  "Invalid email or password. Please check your credentials and try again.";

const SAFE_GENERIC_ERROR =
  "Something went wrong. Please try again.";

// ─── Eye icon (inline SVG, no extra dependency) ───────────────────────────
const EyeIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

// ─── Reusable input component ──────────────────────────────────────────────
const inputClass =
  "w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Feedback
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Email verification
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState("");

  // Brute-force protection
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Forgot-password cooldown (prevents spam)
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // ── Redirect if already signed in ────────────────────────────────────────
  // Single source of truth for post-auth navigation — no competing navigate() calls
  useEffect(() => {
    if (isSignedIn && user) {
      navigate(`/profile/${user.id}`);
    }
  }, [isSignedIn, user, navigate]);

  // ── Lockout countdown ticker ──────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        clearInterval(tick);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockedUntil]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  // ── Form toggle ───────────────────────────────────────────────────────────
  const toggleForm = (form) => {
    setIsLogin(form === "login");
    setError(null);
    setSuccess(null);
    setPendingVerification(false);
    setVerificationCode("");
    setEmail("");
    setPassword("");
    setName("");
    setShowPassword(false);
    setResetSent(false);
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validateLoginForm = () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    return true;
  };

  const validateSignupForm = () => {
    if (!validateName(name)) {
      setError("Full name must be between 2 and 50 characters.");
      return false;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  // ── Main form submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Brute-force gate
    if (isLocked) {
      setError(`Too many failed attempts. Please wait ${lockCountdown}s before trying again.`);
      return;
    }

    if (isLogin) {
      if (!validateLoginForm()) return;
    } else {
      if (!validateSignupForm()) return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        if (!signInLoaded) {
          setError("Sign in system is still loading. Please try again.");
          return;
        }

        const result = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (result.status === "needs_factor_one") {
          setError("Two-factor authentication is required.");
        }
        // On complete, the useEffect handles redirect — no navigate() here
      } else {
        if (!signUpLoaded) {
          setError("Sign up system is still loading. Please try again.");
          return;
        }

        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName: name.trim(),
        });

        if (result.status === "missing_requirements") {
          await signUp.prepareEmailAddressVerification();
          setPendingVerification(true);
          setVerifyingEmail(email.trim());
          setSuccess(`Verification code sent to ${email.trim()}. Please check your inbox.`);
        }
        // On complete, useEffect handles redirect
      }
    } catch (err) {
      console.error("Authentication error:", err);

      if (isLogin) {
        // Increment brute-force counter on every failed login
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        if (attempts >= 5) {
          setLockedUntil(Date.now() + 30_000); // 30 second lockout
          setLoginAttempts(0);
          setError("Too many failed attempts. Please wait 30 seconds before trying again.");
          return;
        }

        if (err.errors) {
          const code = err.errors[0]?.code;
          // ✅ Safe: same message for wrong email OR wrong password — prevents user enumeration
          if (
            code === "form_identifier_not_found" ||
            code === "form_password_incorrect" ||
            code === "form_identifier_exists"
          ) {
            setError(SAFE_AUTH_ERROR);
          } else {
            setError(SAFE_GENERIC_ERROR);
          }
        } else {
          setError(SAFE_GENERIC_ERROR);
        }
      } else {
        if (err.errors) {
          const code = err.errors[0]?.code;
          if (code === "form_identifier_exists") {
            // This one is okay to reveal on signup — user needs to know to log in instead
            setError("An account with this email already exists. Please log in.");
          } else {
            setError(err.errors[0].longMessage || SAFE_GENERIC_ERROR);
          }
        } else {
          setError(SAFE_GENERIC_ERROR);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email verification ────────────────────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!signUp) return;

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSuccess("Email verified successfully! Redirecting...");
        // useEffect will handle the redirect once isSignedIn flips
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      if (err.errors) {
        const code = err.errors[0]?.code;
        if (code === "verification_failed" || code === "form_code_incorrect") {
          setError("Invalid verification code. Please check and try again.");
        } else {
          setError(SAFE_GENERIC_ERROR);
        }
      } else {
        setError("Failed to verify code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!signUp) return;
      await signUp.prepareEmailAddressVerification();
      setSuccess(`New verification code sent to ${verifyingEmail}`);
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth ─────────────────────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setError(null);
    const strategyMap = {
      google: "oauth_google",
      facebook: "oauth_facebook",
      apple: "oauth_apple",
    };
    const clerkProvider = strategyMap[provider] || provider;

    try {
      if (isLogin) {
        if (!signInLoaded) { setError("Sign in system is loading."); return; }
        await signIn.authenticateWithRedirect({
          strategy: clerkProvider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        if (!signUpLoaded) { setError("Sign up system is loading."); return; }
        await signUp.authenticateWithRedirect({
          strategy: clerkProvider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError(SAFE_GENERIC_ERROR);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address first.");
      return;
    }
    // Prevent repeat sends in the same session
    if (resetSent) {
      setSuccess("Reset email already sent. Please check your inbox.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!signInLoaded) return;
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setResetSent(true);
      // ✅ Intentionally vague — doesn't confirm whether the email exists
      setSuccess("If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      console.error("Forgot password error:", err);
      // Same vague message — don't reveal if email exists
      setSuccess("If an account with that email exists, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    if (!loading) navigate("/");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#177529] mx-auto" />
          <p className="mt-4 text-gray-600">Loading authentication system...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-[Lexend] py-8 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={getImageUrl(logo)}
            alt="Campus Katale Logo"
            className="h-16 md:h-20 w-auto"
          />
        </div>

        {/* Tabs */}
        {!pendingVerification && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => toggleForm("login")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isLogin
                  ? "bg-[#177529] text-white"
                  : "text-[#177529] hover:text-[#97C040]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => toggleForm("signup")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? "bg-[#177529] text-white"
                  : "text-[#177529] hover:text-[#97C040]"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-2xl border-2 border-[#97C040] p-6 md:p-8">
          {/* ✅ role="alert" + aria-live for screen readers */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm"
            >
              {success}
            </div>
          )}

          {/* ── Verification Screen ─────────────────────────────────────── */}
          {pendingVerification ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#177529] mb-2">
                  Verify Your Email
                </h3>
                <p className="text-gray-600 text-sm">
                  We've sent a code to{" "}
                  <span className="font-semibold">{verifyingEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                {/* ✅ inputMode="numeric" + digit-only onChange */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  required
                  maxLength="6"
                  autoComplete="one-time-code"
                  className={`${inputClass} text-center text-lg tracking-widest`}
                />
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-3 rounded-lg font-bold text-white bg-[#177529] hover:bg-[#135c21] transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-gray-500 text-sm">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-[#177529] hover:text-[#97C040] font-semibold transition-colors disabled:opacity-50"
                  >
                    Resend
                  </button>
                </p>
                <button
                  onClick={() => {
                    setPendingVerification(false);
                    setVerificationCode("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[#177529] text-sm hover:text-[#97C040] transition-colors"
                >
                  ← Back to Sign Up
                </button>
              </div>
            </div>

          ) : isLogin ? (
            /* ── Login Form ──────────────────────────────────────────────── */
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ✅ autoComplete attributes */}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />

                {/* ✅ Password with show/hide toggle */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                {/* ✅ Lockout warning */}
                {isLocked && (
                  <p className="text-sm text-red-500 text-center">
                    Account temporarily locked. Try again in {lockCountdown}s.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !!isLocked}
                  className="w-full py-3 rounded-lg font-bold text-white bg-[#177529] hover:bg-[#135c21] transition-colors disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="flex justify-end">
                {/* ✅ Disabled while loading */}
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-[#177529] text-sm hover:text-[#97C040] transition-colors disabled:opacity-50"
                >
                  Forgot Password
                </button>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-500 text-sm">or Sign in with</p>
                <div className="flex justify-center gap-4">
                  {["google", "facebook", "apple"].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleOAuth(provider)}
                      disabled={loading}
                      className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      <img
                        src={getImageUrl(
                          provider === "google"
                            ? googleIcon
                            : provider === "facebook"
                            ? facebookIcon
                            : appleIcon
                        )}
                        alt={provider.charAt(0).toUpperCase() + provider.slice(1)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            /* ── Sign Up Form ────────────────────────────────────────────── */
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ✅ autoComplete + validation */}
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  className={inputClass}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />

                {/* ✅ Password with show/hide toggle */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-white bg-[#177529] hover:bg-[#135c21] transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
              </form>

              <div className="text-center space-y-4">
                <p className="text-gray-500 text-sm">or Sign Up with</p>
                <div className="flex justify-center gap-4">
                  {["google", "facebook", "apple"].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleOAuth(provider)}
                      disabled={loading}
                      className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      <img
                        src={getImageUrl(
                          provider === "google"
                            ? googleIcon
                            : provider === "facebook"
                            ? facebookIcon
                            : appleIcon
                        )}
                        alt={provider.charAt(0).toUpperCase() + provider.slice(1)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Back to Home — disabled while loading */}
          {!pendingVerification && (
            <div className="mt-6 text-center">
              <button
                onClick={goHome}
                disabled={loading}
                className="text-[#177529] text-sm hover:text-[#97C040] transition-colors disabled:opacity-50"
              >
                &lt; Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;