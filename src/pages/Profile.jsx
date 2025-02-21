import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { ref, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash, FaEdit, FaSave } from "react-icons/fa";  // ✅ Import Delete & Edit Icons
import { useSwipeable } from "react-swipeable"; // ✅ Swipe gestures
import { signOut } from "firebase/auth"; // ✅ Import signOut
import Swal from "sweetalert2";
import "../styles/profile.css";

const Profile = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [profilePic, setProfilePic] = useState("https://i.pravatar.cc/150");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPostId, setEditingPostId] = useState(null);
    const [setEditing] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState("");
    const [streak, setStreak] = useState(0);
    const [points, setPoints] = useState(0);
    const [seeMoreBio, setSeeMoreBio] = useState(false);
    const [expandedPosts, setExpandedPosts] = useState({});
    const [lastActiveDate, setLastActiveDate] = useState(null);
    const navigate = useNavigate();
    const isCurrentUser = !userId || userId === auth.currentUser?.uid;
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [newName, setNewName] = useState(name);
    const [newBio, setNewBio] = useState(bio);
    const [profileData, setProfileData] = useState({
        fullName: "",
        username: "",
        bio: "",
    });

    useEffect(() => {
        if (!auth.currentUser) {
            navigate("/login");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const uid = userId || auth.currentUser.uid;
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUser(userData);
                    setProfileData({
                        fullName: userData.fullName || "No Name",
                        username: userData.username || "Anonymous",
                        bio: userData.bio || "No bio added yet.", // ✅ Ensures bio is not empty
                    });
                    setName(userData.name || "Anonymous");
                    setBio(userData.bio || "No bio available");
                    setProfilePic(userData.photoURL || "https://i.pravatar.cc/150");
                    setStreak(userData.streak || 0); // ✅ Set streak before calling updateStreak
                    setPoints(userData.points || 0);
                    setLastActiveDate(userData.lastActiveDate || null);
                    setNewName(userData.name || "");
                    setNewBio(userData.bio || "");

                    // ✅ Call updateStreak AFTER setting streak state
                    await updateStreak(userRef, userData.lastActiveDate);
                }
            } catch (error) {
                console.error("❌ User profile not found.", error);
            } finally {
                setLoading(false);
            }
        };

        // ✅ Streak System - Keeps Daily Record
        const updateStreak = async (userRef, lastActive) => {
            const today = new Date().toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            let updatedStreak = streak; // Get current streak

            if (!lastActive) {
                console.log("❗ No last active date found. Initializing streak.");
                updatedStreak = 1;
            } else if (lastActive === today) {
                console.log("🔥 User already active today. Streak unchanged:", updatedStreak);
                return; // Don't update if already active today
            } else if (lastActive === yesterdayString) {
                updatedStreak += 1; // ✅ Increase streak
                console.log("✅ Streak increased to:", updatedStreak);
            } else {
                updatedStreak = 1; // ✅ Reset streak if missed a day
                console.log("⚠️ Streak reset to:", updatedStreak);
            }

            setStreak(updatedStreak); // Update React state
            setLastActiveDate(today);

            try {
                await updateDoc(userRef, {
                    streak: updatedStreak,
                    lastActiveDate: today, // ✅ Ensure Firestore updates last active date
                });
                console.log("🔥 Streak updated in Firestore!");
            } catch (error) {
                console.error("❌ Error updating streak:", error);
            }
        };



        fetchUserProfile();
        fetchUserPosts();
    }, [userId, navigate, streak, lastActiveDate]);

    // ✅ Logout function (placed correctly)
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login"); // ✅ Redirect to Login Page
            Swal.fire({ icon: "success", title: "Logged Out!", text: "You have successfully logged out.", timer: 2000, showConfirmButton: false });
        } catch (error) {
            console.error("❌ Logout Failed:", error);
            Swal.fire({ icon: "error", title: "Logout Failed", text: "Something went wrong while logging out." });
        }
    };

    // ✅ Import Cloudinary Widget
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; // ✅ Works in Vite
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // ✅ Works in Vite
    const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;

// ✅ Ensure Cloudinary widget is loaded
const loadCloudinaryWidget = () => {
    if (!window.cloudinary) {
        const script = document.createElement("script");
        script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
        script.async = true;
        document.body.appendChild(script);
    }
};

    useEffect(() => {
        if (!window.cloudinary) {
            const script = document.createElement("script");
            script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
            script.async = true;
            script.onload = () => {
                console.log("✅ Cloudinary script loaded!");
            };
            document.body.appendChild(script);
        }
    }, []);

const handleProfilePictureChange = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        console.error("❌ Cloudinary credentials are missing.");
        Swal.fire({
            icon: "error",
            title: "Missing Credentials",
            text: "Cloudinary credentials are not set properly.",
        });
        return;
    }

    loadCloudinaryWidget(); // ✅ Load widget if not already loaded

    const widget = window.cloudinary.createUploadWidget(
        {
            cloudName: CLOUD_NAME,
            uploadPreset: UPLOAD_PRESET,
            folder: "profile_pictures",
            cropping: true,
            multiple: false,
            maxFiles: 1,
            resourceType: "image",
        },
        async (error, result) => {
            if (error) {
                console.error("❌ Cloudinary upload error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Upload Failed",
                    text: "Something went wrong while updating your profile picture.",
                });
                return;
            }

            if (result.event === "success") {
                const imageUrl = result.info.secure_url;
                console.log("✅ Uploaded Image URL:", imageUrl);

                try {
                    // ✅ Save image URL to Firestore
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    await updateDoc(userRef, { photoURL: imageUrl });

                    // ✅ Update UI
                    setProfilePic(imageUrl);

                    Swal.fire({
                        icon: "success",
                        title: "Profile Picture Updated!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } catch (firestoreError) {
                    console.error("❌ Error saving to Firestore:", firestoreError);
                }
            }
        }
    );

    widget.open(); // ✅ Open the upload widget
};





    const handleSaveProfile = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { name: newName, bio: newBio });

            setName(newName);
            setBio(newBio);
            setIsEditingProfile(false);

            Swal.fire({
                icon: "success",
                title: "Profile Updated!",
                text: "Your profile changes have been saved.",
                timer: 2000,
                showConfirmButton: false,
            });

            setEditing(false);

        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const uid = userId || auth.currentUser.uid;
            const q = query(
                collection(db, "posts"),
                where("userId", "==", uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const userPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(userPosts);
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const toggleSeeMorePost = (postId) => {
        setExpandedPosts((prevState) => ({
            ...prevState,
            [postId]: !prevState[postId],
        }));
    };

    // ✅ Function to Enable Editing
    const handleEditPost = (postId, content) => {
        setEditingPostId(postId);
        setEditingPostContent(content || ""); // Ensure there's always content
    };

    // ✅ Function to Save Edited Post
    const handleSaveEdit = async (postId) => {
        if (!editingPostContent.trim()) {
            Swal.fire({ icon: "warning", title: "Oops!", text: "Post content cannot be empty!" });
            return;
        }

        try {
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, { content: editingPostContent });

            // ✅ Update UI Immediately After Save
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId ? { ...post, content: editingPostContent } : post
                )
            );

            // ✅ Reset Editing State
            setEditingPostId(null);
            setEditingPostContent("");

            Swal.fire({ icon: "success", title: "Post Updated!", text: "Your post has been updated successfully.", timer: 2000, showConfirmButton: false });
        } catch (error) {
            console.error("Error updating post:", error);
            Swal.fire({ icon: "error", title: "Oops!", text: "Something went wrong while updating the post." });
        }
    };

    const handleDeletePost = async (postId, imageUrl) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "posts", postId));

                    if (imageUrl)
                        if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
                        const imageRef = ref(storage, imageUrl);
                        await deleteObject(imageRef);
                    }

                    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

                    Swal.fire({
                        icon: "success",
                        title: "Post Deleted!",
                        text: "Your post has been successfully deleted.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } catch (error) {
                    console.error("Error deleting post:", error);
                    Swal.fire({
                        icon: "error",
                        title: "Oops!",
                        text: "Something went wrong while deleting the post.",
                    });
                }
            }
        });
    };

    // ✅ Handle Swipe Gestures to Navigate Between Profile & Feed
    const handlers = useSwipeable({
        onSwipedRight: () => navigate("/feed"), // Swipe Right to Go to Feed
        trackMouse: true,

    });
    return (

        <div className="profile-container" {...handlers} style={{ paddingTop: "10px" }}>
            {loading ? (
                <p>Loading profile...</p>

            ) : (
                <>
                    <div className="profile-header">
                        {/* ✅ Profile Picture Upload */}
                            <label htmlFor="profile-pic-upload" className="profile-pic-label">
                            <img src={profilePic} alt="Profile" className="profile-pic" />
                        </label>
                            <button className="upload-btn" onClick={handleProfilePictureChange}>
                                Upload New Profile Picture
                            </button>

                            <h2>{name}</h2>
                            
                        <p className="bio">
                            {seeMoreBio || bio.length <= 100 ? bio : `${bio.substring(0, 100)}...`}
                            {bio.length > 100 && (
                                <span className="see-more" onClick={() => setSeeMoreBio(!seeMoreBio)}>
                                    {seeMoreBio ? " See Less" : " See More"}
                                </span>
                            )}
                            </p>
                            {/* ✅ Streak and Points Display */}
                            <div className="streak-points">
                                <p>🔥 Streak: {streak} Days</p>
                                <p>🏆 Points: {points}</p>

                            </div>
                           

                        </div>

                        {/* ✅ Edit Profile Button */}
                        {isCurrentUser && (
                            <div className="profile-info">
                                {isEditingProfile ? ( // ✅ Now properly checking for profile edit mode
                                    <>
                                        <label>Username:</label>
                                        <input
                                            type="text"
                                            value={newName} // ✅ Uses `newName` instead of `name`
                                            onChange={(e) => setNewName(e.target.value)}
                                        />

                                        <label>Bio:</label>
                                        <textarea
                                            value={newBio} // ✅ Uses `newBio` instead of `bio`
                                            onChange={(e) => setNewBio(e.target.value)}
                                        />

                                        <button onClick={handleSaveProfile}>Save Profile</button>
                                        <button onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                    </>
                                ) : (
                                    <button className="edit-profile-btn" onClick={() => {
                                        setNewName(name); // ✅ Set current name before editing
                                        setNewBio(bio);   // ✅ Set current bio before editing
                                        setIsEditingProfile(true);
                                    }}>
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        )}


                        {/* ✅ Logout Button (Added in profile header) */}
                        {isCurrentUser && (
                            <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
                        )}

                        <div className="user-posts">
                            <h3>{isCurrentUser ? "Your Posts" : `${name}'s Posts`}</h3>

                            {posts.length === 0 ? (
                                <p>No posts yet.</p>
                            ) : (
                                posts.map((post) => (
                                    <div key={post.id} className="post-card">
                                        {/* ✅ Show Editable Textarea When Editing */}
                                        {editingPostId === post.id ? (
                                            <textarea
                                                value={editingPostContent}
                                                onChange={(e) => setEditingPostContent(e.target.value)}
                                                className="edit-textarea"
                                            />
                                        ) : (
                                            <p>
                                                {expandedPosts[post.id] || (typeof post.content === "string" && post.content.length <= 200)
                                                    ? post.content || "No content available"
                                                    : typeof post.content === "string"
                                                        ? `${post.content.substring(0, 200)}... `
                                                        : "No content available"}
                                                {typeof post.content === "string" && post.content.length > 200 && (
                                                    <span className="see-more" onClick={() => toggleSeeMorePost(post.id)}>
                                                        {expandedPosts[post.id] ? " See Less" : " See More"}
                                                    </span>
                                                )}
                                            </p>
                                        )}

                                        {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image" />}
                                        <p className="post-time">Posted on: {new Date(post.createdAt.seconds * 1000).toLocaleString()}</p>

                                        {/* ✅ Edit and Delete Icons */}
                                        {isCurrentUser && (
                                            <div className="post-actions">
                                                {editingPostId === post.id ? (
                                                    <FaSave className="icon save-edit" onClick={() => handleSaveEdit(post.id)} />
                                                ) : (
                                                    <FaEdit className="icon edit-post" onClick={() => handleEditPost(post.id, post.content)} />
                                                )}
                                                <FaTrash className="icon delete-post" onClick={() => handleDeletePost(post.id, post.imageUrl)} />
                                            </div>
                                        )}

                                    </div>
                                ))
                            )}

                        </div>

                    {/* ✅ Edit Profile Modal */}
                    
                </>
            )}
        </div>
    );
};

export default Profile;