import React, { useState, useEffect, useRef, useContext } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import brandLogo from "../Images/splendid-logo-2.png";
import rainbow_gradient_bg from "../Images/rainbow-gradient.jpg";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/;
const PEACH = "#d4a68d";

const BorderedInput = React.forwardRef((props, ref) => (
  <input
    {...props}
    ref={ref}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
  />
));

const PeachButton = ({ children, disabled, loading, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    style={{ backgroundColor: disabled || loading ? "#e0c9b2" : PEACH }}
    className={`w-full py-2 rounded-md text-white font-medium transition ${disabled || loading ? "cursor-not-allowed" : "hover:opacity-90"
      } flex items-center justify-center`}
  >
    {loading ? <Spinner /> : children}
  </button>
);

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white mx-auto" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const AdminAuth = () => {
  const { refreshAuth } = useContext(AdminAuthContext);
  const [otpVisible, setOtpVisible] = useState(false); // <-- ADD this near OTP state


  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset" | "otp"
  const [pendingAction, setPendingAction] = useState("login");

  // form fields
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);
  const inputsRef = useRef([]);

  // loading flags
  const [isSendingLogin, setIsSendingLogin] = useState(false);
  const [isSendingSignup, setIsSendingSignup] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);

  // clear fields on mode switch
  useEffect(() => {
    if (mode === "login") {
      setGmail("");
      setPassword("");
    }
    if (mode === "signup") {
      setGmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
    }
    if (mode === "reset") {
      setGmail("");
      setNewPassword("");
    }
    if (mode === "otp") {
      setOtp(new Array(6).fill(""));
    }
  }, [mode]);

  // 180s OTP timer 
  useEffect(() => {
    if (mode !== "otp") return;
    setTimer(180);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((t) =>
        t <= 1 ? (clearInterval(intervalRef.current), 0) : t - 1
      );
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [mode]);

  // validations
  const loginValid = GMAIL_REGEX.test(gmail) && password;
  const signupValid =
    firstName && lastName && GMAIL_REGEX.test(gmail) && password;
  const resetValid = GMAIL_REGEX.test(gmail) && newPassword;
  const otpValid = otp.every((d) => d !== "");

  // Helper to extract friendly error message from axios error
  const extractApiError = (err, fallback = "An error occurred.") => {
    if (!err) return fallback;
    // axios network error
    if (err.response) {
      const { data, status } = err.response;
      // If server sent a JSON message field
      if (data && typeof data === "object" && data.message) return data.message;
      // If server sent a plain string (rate limiter often does)
      if (typeof data === "string" && data.trim()) return data.trim();
      // Fall back to status-based message
      if (status === 429) return "Too many requests. Please try again later.";
      return fallback;
    }
    if (err.message) return err.message;
    return fallback;
  };

  // unified OTP sender
  const sendOtpAndSwitch = async (action) => {
    setPendingAction(action);
    try {
      await api.post("/owner/send-otp", {
        email: gmail,
        type: action,
        ...(action === "login" && { password }), // only send password for login
      });
      toast.success("OTP sent! Please check your email.");
      setMode("otp");
      // start timer when OTP is sent
      setTimer(180);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = extractApiError(err, "Error sending OTP.");
      // Distinguish rate-limiting and other cases visibly
      if (err?.response?.status === 429) {
        toast.error(msg || "Too many requests. Try again later.");
      } else {
        toast.error(msg);
      }
      console.error("Send OTP error:", err);
    }
  };

  const handleLogin = async () => {
    if (!loginValid) return;
    setIsSendingLogin(true);
    await sendOtpAndSwitch("login");
    setIsSendingLogin(false);
  };

  const handleSignup = async () => {
    if (!signupValid) return;
    setIsSendingSignup(true);
    await sendOtpAndSwitch("createAccount");
    setIsSendingSignup(false);
  };

  const handleReset = async () => {
    if (!resetValid) return;
    setIsSendingReset(true);
    await sendOtpAndSwitch("forgotPassword");
    setIsSendingReset(false);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await api.post("/owner/send-otp", {
        email: gmail,
        type: pendingAction,
        ...(pendingAction === "login" && { password }),
      });
      toast.success("OTP resent! Check your email.");
      // Reset timer and restart countdown manually
      setTimer(180);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = extractApiError(err, "Error resending OTP.");
      toast.error(msg);
      console.error("Resend OTP error:", err);
    }
  };

  const handleVerify = async () => {
    if (!otpValid || isVerifying) return toast.error("Enter all 6 digits.");
    setIsVerifying(true);
    const code = otp.join("");

    let url, body;
    if (pendingAction === "login") {
      url = "/owner/login";
      body = { email: gmail, otp: code, password };
    } else if (pendingAction === "createAccount") {
      url = "/owner/create-account";
      body = { firstName, lastName, email: gmail, otp: code, password };
    } else {
      url = "/owner/reset-password";
      body = { email: gmail, otp: code, newPassword };
    }

    try {
      await api.post(url, body);
      const successText =
        pendingAction === "login"
          ? "Logged in!"
          : pendingAction === "createAccount"
            ? "Account created!"
            : "Password reset!";

      toast.success("✅ " + successText);

      if (pendingAction === "login") {
        const ok = await refreshAuth();
        if (!ok) {
          toast.error("Could not verify session. Please try again.");
          setIsVerifying(false);
          return;
        }
        navigate("/Admin");
      } else {
        setMode("login");
      }
    } catch (err) {
      const msg = extractApiError(err, "Action failed.");
      toast.error(msg);
      console.error("Verify error:", err);
    }
    setIsVerifying(false);
  };

  // OTP input handlers
  const onOtpChange = (e, idx) => {
    const val = e.target.value.replace(/\D/, "");
    const copy = [...otp];
    copy[idx] = val ? val[0] : "";
    setOtp(copy);
    if (val && idx < 5) inputsRef.current[idx + 1].focus();
  };
  const onOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const copy = [...otp];
      copy[idx - 1] = "";
      setOtp(copy);
      inputsRef.current[idx - 1].focus();
    }
  };

  return (
    <div
      className="w-screen h-screen  bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${rainbow_gradient_bg})` }}
    >
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg">
        <img src={brandLogo} alt="Logo" className="h-16 mx-auto mb-6" />

        {mode === "login" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <BorderedInput
              placeholder="Gmail (@gmail.com)"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
            />
            <BorderedInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PeachButton
              onClick={handleLogin}
              disabled={!loginValid || isSendingLogin}
            >
              {isSendingLogin ? "Sending..." : "Log In"}
            </PeachButton>
            <div className="flex justify-between text-sm">
              <button
                className="text-purple-600 hover:underline"
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
              <button
                className="text-purple-600 hover:underline"
                onClick={() => setMode("reset")}
              >
                Reset password
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup();
            }}
          >
            <BorderedInput
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <BorderedInput
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <BorderedInput
              placeholder="Gmail (@gmail.com)"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
            />
            <BorderedInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PeachButton
              onClick={handleSignup}
              disabled={!signupValid || isSendingSignup}
            >
              {isSendingSignup ? "Sending..." : "Create Account"}
            </PeachButton>
            <button
              className="text-gray-600 hover:underline block mx-auto"
              onClick={() => setMode("login")}
            >
              Back to login
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleReset();
            }}
          >
            <BorderedInput
              placeholder="Gmail (@gmail.com)"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
            />
            <BorderedInput
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PeachButton
              onClick={handleReset}
              disabled={!resetValid || isSendingReset}
            >
              {isSendingReset ? "Sending..." : "Reset Password"}
            </PeachButton>
            <button
              className="text-gray-600 hover:underline block mx-auto"
              onClick={() => setMode("login")}
            >
              Back to login
            </button>
          </form>
        )}

        {mode === "otp" && (
          <form
            className="space-y-6 text-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
          >
            <h2 className="text-lg font-semibold">Enter 6-Digit OTP</h2>
            <div className="flex justify-center gap-2 items-center">
              <div className="flex gap-2">
                {otp.map((d, i) => (
                  <BorderedInput
                    key={i}
                    maxLength={1}
                    type={otpVisible ? "text" : "password"}
                    value={d}
                    onChange={(e) => onOtpChange(e, i)}
                    onKeyDown={(e) => onOtpKeyDown(e, i)}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className="w-12 h-12 text-center"
                    disabled={isVerifying}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOtpVisible((v) => !v)}
                className="ml-3 p-1 rounded text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label={otpVisible ? "Hide OTP" : "Show OTP"}
                tabIndex={-1}
              >
                {otpVisible ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            <PeachButton onClick={handleVerify} disabled={!otpValid || isVerifying} loading={isVerifying}>
              Verify
            </PeachButton>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                className={`text-gray-600 hover:underline ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isVerifying}
                onClick={() => setMode("login")}
              >
                Back to login
              </button>
              <button
                type="button"
                disabled={timer > 0 || isVerifying}
                onClick={handleResend}
                className={`hover:underline ${timer > 0 || isVerifying
                  ? "opacity-50 cursor-not-allowed text-gray-500"
                  : "text-purple-600"
                  }`}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};