﻿import React, { useState, useEffect } from "react";
import { auth, signInWithGoogle } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Login.css";


const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) navigate("/feed");
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ❌ Prevent unverified users from logging in
            if (!user.emailVerified) {
                Swal.fire({ icon: "warning", title: "Email Not Verified", text: "Please check your email for the verification link." });
                await signOut(auth); // Log them out immediately
                return;
            }

            navigate("/feed");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Login Failed", text: error.message });
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ❌ Prevent unverified users from logging in
            if (!user.emailVerified) {
                alert("Please verify your email before logging in. Check your inbox for the verification link.");
                await auth.signOut(); // Log them out immediately
                setLoading(false);
                return;
            }

            navigate("/feed");
        } catch (error) {
            console.error("Login Error:", error.message);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            navigate("/feed");
        } catch (error) {
            console.error("Google Login Error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Dzaleka Online</h2>
            <form onSubmit={handleEmailLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                
            </form>
            <button onClick={handleGoogleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign in with Google"}</button>
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>

        </div>
    );
};

export default Login;
