import React, { useState } from "react";
import { auth, db } from "../firebase"; // Ensure Firebase is correctly imported
import { createUserWithEmailAndPassword, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/signup.css"; // Add custom styles

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ Email & Password Sign Up
    const handleEmailSignUp = async () => {
        if (!email || !password) {
            Swal.fire("Oops!", "Please fill in all fields", "warning");
            return;
        }

        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ✅ Save user details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
                points: 0,
                streak: 0,
            });

            Swal.fire("Success!", "Account created successfully!", "success");
            navigate("/feed"); // Redirect to feed after signup
        } catch (error) {
            Swal.fire("Error!", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Phone Number Sign-Up (OTP Authentication)
    const handlePhoneSignUp = async () => {
        if (!phone) {
            Swal.fire("Oops!", "Please enter a valid phone number", "warning");
            return;
        }

        try {
            setLoading(true);
            const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
            });

            const confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
            setConfirmationResult(confirmation);
            Swal.fire("OTP Sent!", "Check your phone for the verification code.", "info");
        } catch (error) {
            Swal.fire("Error!", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Verify OTP and Sign in with Phone
    const verifyOtp = async () => {
        if (!otp) {
            Swal.fire("Oops!", "Please enter the OTP", "warning");
            return;
        }

        try {
            setLoading(true);
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

            // ✅ Save user in Firestore
            await setDoc(doc(db, "users", user.uid), {
                phone: user.phoneNumber,
                createdAt: new Date(),
                points: 0,
                streak: 0,
            });

            Swal.fire("Success!", "Phone number verified successfully!", "success");
            navigate("/feed"); // Redirect to feed after signup
        } catch (error) {
            Swal.fire("Error!", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Anonymous Sign-In (Guest Mode)
    const handleAnonymousSignIn = async () => {
        try {
            setLoading(true);
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;

            Swal.fire("Welcome!", "You are now browsing anonymously", "info");
            navigate("/feed"); // Redirect to feed
        } catch (error) {
            Swal.fire("Error!", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Create an Account</h2>

            {/* ✅ Email & Password Signup */}
            <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleEmailSignUp} disabled={loading}>{loading ? "Signing Up..." : "Sign Up with Email"}</button>

            {/* ✅ Phone Number Signup */}
            <input type="text" placeholder="Enter Phone Number (+265...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button onClick={handlePhoneSignUp} disabled={loading}>Send OTP</button>

            {/* ✅ OTP Verification */}
            {confirmationResult && (
                <>
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <button onClick={verifyOtp} disabled={loading}>Verify OTP</button>
                </>
            )}

            {/* ✅ Anonymous Sign-In */}
            <button onClick={handleAnonymousSignIn} className="guest-btn">Continue as Guest</button>

            <div id="recaptcha-container"></div>
        </div>
    );
};

export default SignUp;
