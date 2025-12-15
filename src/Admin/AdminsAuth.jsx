import React, { useState, useEffect, useRef, useContext } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import brandLogo from "../Images/splendid-logo-2.png";
import rainbow_gradient_bg from "../Images/rainbow-gradient.jpg";
import { toast } from "sonner";
import { AdminAuthContext } from "@/context/AdminAuthContext";
import { Eye, EyeOff } from "lucide-react"; // <-- Add Lucide icons

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/;
const PEACH = "#d4a68d";

const BorderedInput = React.forwardRef((props, ref) => (
  <input
    {...props}
    ref={ref}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
  />
));

const PeachButton = ({ children, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled}
    style={{ backgroundColor: disabled ? "#e0c9b2" : PEACH }}
    className={`w-full py-2 rounded-md text-white font-medium transition ${disabled ? "cursor-not-allowed" : "hover:opacity-90"
      }`}
  >
    {children}
  </button>
);

export const AdminsAuth = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useContext(AdminAuthContext);

  // --- mode & pendingAction ---
  const [mode, setMode] = useState("login");
  const [pendingAction, setPendingAction] = useState("login");

  // --- form fields ---
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // --- OTP state ---
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpVisible, setOtpVisible] = useState(false); // <-- Add otpVisible state
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);
  const inputsRef = useRef([]);

  // --- loading flags ---
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (mode === "login") {
      setGmail("");
      setPassword("");
    }
    if (mode === "reset") {
      setGmail("");
      setNewPassword("");
    }
    if (mode === "otp") {
      setOtp(new Array(6).fill(""));
    }
    clearInterval(intervalRef.current);
    setTimer(0);
  }, [mode]);

  useEffect(() => {
    if (mode !== "otp") return;
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
    return () => clearInterval(intervalRef.current);
  }, [mode]);

  const extractApiError = (err, fallback = "An error occurred.") => {
    if (!err) return fallback;
    if (err.response) {
      const { data, status } = err.response;
      if (data && typeof data === "object" && data.message) return data.message;
      if (typeof data === "string" && data.trim()) return data.trim();
      if (status === 429) return "Too many requests. Please try again later.";
      return fallback;
    }
    if (err.message) return err.message;
    return fallback;
  };

  const sendOtpAndSwitch = async (action) => {
    if (!GMAIL_REGEX.test(gmail)) {
      return toast.warning("Enter a valid Gmail address.");
    }
    setPendingAction(action);
    setIsSending(true);
    try {
      await api.post("/employee/send-otp", {
        email: gmail,
        type: action,
        ...(action === "login" && { password }),
      });
      toast.success("OTP sent! Please check your email.");
      setMode("otp");
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
      if (err?.response?.status === 429) {
        toast.error(msg || "Too many requests. Please try again later.");
      } else {
        toast.error(msg);
      }
      console.error("Send OTP error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = () => sendOtpAndSwitch("login");
  const handleReset = () => sendOtpAndSwitch("forgotPassword");

  const handleResend = async () => {
    if (timer > 0) return;
    setIsSending(true);
    try {
      await api.post("/employee/send-otp", {
        email: gmail,
        type: pendingAction,
        ...(pendingAction === "login" && { password }),
      });
      toast.success("OTP resent! Check your email.");
      clearInterval(intervalRef.current);
      setTimer(180);
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
      if (err?.response?.status === 429) {
        toast.error(msg || "Too many requests. Please try again later.");
      } else {
        toast.error(msg);
      }
      console.error("Resend OTP error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.some((d) => !d)) return toast.warning("Enter all 6 digits.");
    const code = otp.join("");
    let url, body;

    if (pendingAction === "login") {
      url = "/employee/login-admin";
      body = { email: gmail, password, otp: code };
    } else {
      url = "/employee/reset-password-admin";
      body = { email: gmail, newPassword, otp: code };
    }

    setIsSending(true);
    try {
      await api.post(url, body);
      const text = pendingAction === "login" ? "Logged in!" : "Password reset!";
      toast.success("✅ " + text);
      if (pendingAction === "login") {
        await refreshAuth();
        navigate("/Admin");
      } else {
        setMode("login");
      }
    } catch (err) {
      const msg = extractApiError(err, "Action failed.");
      toast.error(msg);
      console.error("Verify error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // OTP inputs logic
  const onOtpChange = (e, idx) => {
    const val = e.target.value.replace(/\D/, "");
    setOtp((prev) => {
      const copy = [...prev];
      copy[idx] = val.charAt(0) || "";
      return copy;
    });
    if (val && idx < 5) inputsRef.current[idx + 1].focus();
  };
  const onOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      setOtp((prev) => {
        const copy = [...prev];
        copy[idx - 1] = "";
        return copy;
      });
      inputsRef.current[idx - 1].focus();
    }
  };

  return (
    <div
      className="w-screen h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${rainbow_gradient_bg})` }}
    >
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg">
        <img src={brandLogo} alt="Logo" className="h-16 mx-auto mb-6" />

        {/* LOGIN */}
        {mode === "login" && (
          <div className="space-y-4">
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
              disabled={!GMAIL_REGEX.test(gmail) || !password || isSending}
            >
              {isSending ? "Sending..." : "Log In"}
            </PeachButton>
            <div className="flex justify-end text-sm">
              <button
                className="text-purple-600 hover:underline"
                onClick={() => setMode("reset")}
              >
                Reset password
              </button>
            </div>
          </div>
        )}

        {/* RESET */}
        {mode === "reset" && (
          <div className="space-y-4">
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
              disabled={!GMAIL_REGEX.test(gmail) || !newPassword || isSending}
            >
              {isSending ? "Sending..." : "Reset Password"}
            </PeachButton>
            <div className="flex justify-end text-sm">
              <button
                className="text-purple-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Back to login
              </button>
            </div>
          </div>
        )}

        {/* OTP VERIFICATION */}
        {mode === "otp" && (
          <div className="space-y-6 text-center">
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
            <PeachButton
              onClick={handleVerify}
              disabled={otp.some((d) => !d) || isSending}
            >
              {isSending ? "Verifying..." : "Verify"}
            </PeachButton>
            <div className="flex justify-between text-sm">
              <button
                className="text-gray-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Back to login
              </button>
              <button
                onClick={handleResend}
                disabled={timer > 0 || isSending}
                className={`hover:underline ${timer > 0
                  ? "opacity-50 cursor-not-allowed text-gray-500"
                  : "text-purple-600"
                  }`}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};