import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    signInWithCredential,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    signOut
} from "firebase/auth";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/signup.css";

const SignUp = () => {
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [password, setPassword] = useState("");
    const [verificationId, setVerificationId] = useState(null);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPhoneVerification, setIsPhoneVerification] = useState(false);
    const navigate = useNavigate();

    // ✅ Initialize reCAPTCHA on component mount
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: (response) => {
                    console.log("🔹 reCAPTCHA verified:", response);
                },
                "expired-callback": () => {
                    console.log("🔄 reCAPTCHA expired, resetting...");
                    window.recaptchaVerifier.reset();
                },
            });
        }
    }, []);

    // ✅ Validate phone number format (E.164 format)
    const isPhoneNumber = (input) => /^\+\d{10,15}$/.test(input);

    // ✅ Check if username is taken
    const isUsernameTaken = async (username) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    // ✅ Handle sign-up logic
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!emailOrPhone || !password || !fullName || !username) {
            Swal.fire({ icon: "error", title: "All fields are required!" });
            return;
        }

        if (await isUsernameTaken(username)) {
            Swal.fire({ icon: "error", title: "Username Taken", text: "Please choose another username." });
            return;
        }

        if (isPhoneNumber(emailOrPhone)) {
            setIsPhoneVerification(true);
            sendOTP();
        } else {
            handleEmailSignup();
        }
    };

    // ✅ Email Sign-Up with verification
    const handleEmailSignup = async () => {
        try {
            setLoading(true);

            // ✅ Validate email format
            if (!/\S+@\S+\.\S+/.test(emailOrPhone)) {
                Swal.fire({ icon: "error", title: "Invalid Email", text: "Enter a valid email address." });
                return;
            }

            // ✅ Create User with Email & Password
            const userCredential = await createUserWithEmailAndPassword(auth, emailOrPhone, password);
            const user = userCredential.user;

            // ✅ Update Firebase Auth Profile with Username
            await updateProfile(user, {
                displayName: username, // ✅ Set username in Firebase Auth
            });

            // ✅ Send Email Verification
            await sendEmailVerification(user);
            Swal.fire({ icon: "info", title: "Verify Email", text: "Check your inbox for a verification email." });

            // ✅ Store User Info in Firestore (Ensure it has username & bio)
            await setDoc(doc(db, "users", user.uid), {
                fullName,
                username,
                email: emailOrPhone,
                bio: "", // ✅ Ensure bio field exists
                createdAt: new Date(),
                verified: false, // Mark as unverified
            });

            // ✅ Log Out User After Signup to Ensure They Verify First
            await signOut(auth);

            navigate("/login"); // Redirect to login
        } catch (error) {
            Swal.fire({ icon: "error", title: "Sign Up Failed", text: error.message });
        } finally {
            setLoading(false);
        }
    };


    // ✅ Send OTP for phone verification
    const sendOTP = async () => {
        if (!isPhoneNumber(emailOrPhone)) {
            Swal.fire({ icon: "error", title: "Invalid Phone Number", text: "Use E.164 format (e.g., +265998123456)." });
            return;
        }

        try {
            setLoading(true);

            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                    size: "invisible",
                });
            }

            const confirmationResult = await signInWithPhoneNumber(auth, emailOrPhone, window.recaptchaVerifier);
            setVerificationId(confirmationResult.verificationId);
            Swal.fire({ icon: "info", title: "OTP Sent!", text: "Check your phone for the verification code." });

        } catch (error) {
            console.error("❌ OTP Error:", error.message);
            Swal.fire({ icon: "error", title: "OTP Failed", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    // ✅ Verify OTP
    const verifyOTP = async () => {
        if (!otp) {
            Swal.fire({ icon: "error", title: "Enter OTP" });
            return;
        }

        try {
            setLoading(true);

            if (!verificationId) {
                Swal.fire({ icon: "error", title: "OTP Verification Failed", text: "No OTP request found. Try again." });
                return;
            }

            const credential = PhoneAuthProvider.credential(verificationId, otp);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName,
                username,
                phoneNumber: emailOrPhone,
                createdAt: new Date(),
                verified: true,
            });

            Swal.fire({ icon: "success", title: "Phone Verified!", text: "You can now use your account." });
            navigate("/feed");
        } catch (error) {
            Swal.fire({ icon: "error", title: "OTP Verification Failed", text: error.message });
            console.error("❌ OTP Verification Error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
                <input type="text" placeholder="Enter Email or Phone (+265...)" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? "Signing Up..." : "Sign Up"}</button>
            </form>

            {isPhoneVerification && (
                <>
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <button onClick={verifyOTP} disabled={loading}>Verify OTP</button>
                </>
            )}

            <div id="recaptcha-container"></div>
        </div>
    );
};

export default SignUp;
