import React, { useState, useEffect } from "react";
import { useSignIn, useSignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import googleIcon from "../assets/Google.png";
import facebookIcon from "../assets/facebook.png";
import appleIcon from "../assets/icloud.png";
import { getImageUrl } from "../utils/imageUtils";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState("");

  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const toggleForm = (form) => {
    setIsLogin(form === "login");
    // Reset states when switching forms
    setError(null);
    setSuccess(null);
    setPendingVerification(false);
    setVerificationCode("");
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (!signInLoaded) {
          setError("Sign in system is still loading. Please try again.");
          setLoading(false);
          return;
        }

        // Try to sign in with the provided credentials
        const result = await signIn.create({
          identifier: email,
          password,
        });

        // If the sign in attempt requires another step (like 2FA), handle it
        if (result.status === "needs_factor_one") {
          console.log("2FA required");
          setError("Two-factor authentication is required.");
        } else if (result.status === "complete") {
          // Sign in was successful
          await navigate("/");
        } else {
          console.log("Sign-in next step:", result);
        }
      } else {
        if (!signUpLoaded) {
          setError("Sign up system is still loading. Please try again.");
          setLoading(false);
          return;
        }

        // Create the user account
        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
        });

        // Send email verification
        if (result.status === "missing_requirements") {
          await signUp.prepareEmailAddressVerification();
          setPendingVerification(true);
          setVerifyingEmail(email);
          setSuccess(`Verification code sent to ${email}. Please check your email and enter the code below.`);
        } else if (result.status === "complete") {
          // Sign up was successful and user is signed in
          await navigate("/");
        } else {
          console.log("Sign-up next step:", result);
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      
      // Handle Clerk specific errors
      if (err.errors) {
        const clerkError = err.errors[0];
        setError(clerkError.longMessage || clerkError.message);
        
        // Handle specific error codes
        if (clerkError.code === "form_identifier_not_found") {
          setError("No account found with this email address.");
        } else if (clerkError.code === "form_password_incorrect") {
          setError("Incorrect password. Please try again.");
        } else if (clerkError.code === "form_identifier_exists") {
          setError("An account with this email already exists.");
        }
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!signUp) return;

      // Attempt to verify the email with the provided code
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        console.log("Verification result:", result);
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      if (err.errors) {
        const clerkError = err.errors[0];
        if (clerkError.code === "verification_failed") {
          setError("Invalid verification code. Please check and try again.");
        } else {
          setError(clerkError.longMessage || clerkError.message);
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

  const handleOAuth = async (provider) => {
    try {
      setError(null);
      
      const strategyMap = {
        google: "oauth_google",
        facebook: "oauth_facebook",
        apple: "oauth_apple"
      };

      const clerkProvider = strategyMap[provider] || provider;

      if (isLogin) {
        if (!signInLoaded) {
          setError("Sign in system is loading. Please try again.");
          return;
        }
        
        await signIn.authenticateWithRedirect({
          strategy: clerkProvider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        if (!signUpLoaded) {
          setError("Sign up system is loading. Please try again.");
          return;
        }
        
        await signUp.authenticateWithRedirect({
          strategy: clerkProvider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError(err.errors ? err.errors[0].message : "Failed to authenticate with provider.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      if (!signInLoaded) return;
      
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.errors ? err.errors[0].message : "Failed to send reset email.");
    }
  };

  const goHome = () => navigate("/");

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      navigate(`/profile/${user.id}`);
    }
  }, [isSignedIn, user, navigate]);

  // Show loading state while Clerk is initializing
  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#177529] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication system...</p>
        </div>
      </div>
    );
  }

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

        {/* Tabs - Hide during verification */}
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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {pendingVerification ? (
            /* Email Verification Form */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#177529] mb-2">Verify Your Email</h3>
                <p className="text-gray-600 text-sm">
                  We've sent a verification code to <span className="font-semibold">{verifyingEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter 6-digit verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength="6"
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400 text-center text-lg tracking-widest"
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
            /* Login Form */
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-white bg-[#177529] hover:bg-[#135c21] transition-colors disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="flex justify-end">
                <button
                  onClick={handleForgotPassword}
                  className="text-[#177529] text-sm hover:text-[#97C040] transition-colors"
                >
                  Forgot Password
                </button>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-500 text-sm">or Sign in with</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(googleIcon)} alt="Google" className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => handleOAuth("facebook")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(facebookIcon)} alt="Facebook" className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => handleOAuth("apple")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(appleIcon)} alt="Apple" className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#97C040] bg-white focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] placeholder-gray-400"
                />
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
                  <button
                    onClick={() => handleOAuth("google")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(googleIcon)} alt="Google" className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => handleOAuth("facebook")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(facebookIcon)} alt="Facebook" className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => handleOAuth("apple")}
                    className="w-12 h-12 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img src={getImageUrl(appleIcon)} alt="Apple" className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Back to Home Link - Hide during verification */}
          {!pendingVerification && (
            <div className="mt-6 text-center">
              <button
                onClick={goHome}
                className="text-[#177529] text-sm hover:text-[#97C040] transition-colors"
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