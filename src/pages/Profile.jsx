import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../styles/profile.css";

const Profile = () => {
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            console.log("Fetching user profile...");

            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                console.log("Profile Data:", userData);
                setName(userData.name || "");
                setBio(userData.bio || "");
                setProfilePicture(userData.profilePicture || "");
            } else {
                console.log("User profile does not exist. Creating...");
                await setDoc(userRef, { name: "", bio: "", profilePicture: "" });
            }
        };

        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        console.log("Saving profile...");
        setLoading(true);
        const userId = auth.currentUser.uid;
        const userRef = doc(db, "users", userId);
        let profilePicUrl = profilePicture;

        if (image) {
            console.log("Uploading image...");
            const imageRef = ref(storage, `profilePictures/${userId}`);
            const uploadTask = uploadBytesResumable(imageRef, image);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload Progress: ${progress}%`);
                    setUploadProgress(progress.toFixed(0)); // Convert to a whole number
                },
                (error) => {
                    console.error("Upload failed:", error);
                    alert("Image upload failed!");
                    setLoading(false);
                },
                async () => {
                    console.log("Upload complete. Getting download URL...");
                    profilePicUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log("Profile Picture URL:", profilePicUrl);

                    await updateDoc(userRef, { profilePicture: profilePicUrl });
                    setProfilePicture(profilePicUrl);
                    setUploadProgress(0);
                    setLoading(false);
                    alert("Profile updated!");
                }
            );
        } else {
            await updateDoc(userRef, { name, bio });
            setLoading(false);
            alert("Profile updated!");
        }
    };

    return (
        <div className="profile-container">
            <h2>Profile</h2>
            {profilePicture && <img src={profilePicture} alt="Profile" className="profile-pic" />}
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            {/* Progress Bar - Should show when uploading */}
            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                    </div>
                </div>
            )}

            <button onClick={handleSaveProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
            </button>
        </div>
    );
};

export default Profile;
