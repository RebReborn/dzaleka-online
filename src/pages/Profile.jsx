import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2
import "../styles/profile.css";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [profilePic, setProfilePic] = useState("https://i.pravatar.cc/150"); // Default avatar
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) {
            navigate("/login"); // Redirect if not logged in
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUser(userData);
                    setName(userData.name || "");
                    setBio(userData.bio || "");
                    setProfilePic(userData.photoURL || "https://i.pravatar.cc/150");
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserPosts = async () => {
            try {
                const q = query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid));
                const querySnapshot = await getDocs(q);
                const userPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPosts(userPosts);
            } catch (error) {
                console.error("Error fetching user posts:", error);
            }
        };

        fetchUserProfile();
        fetchUserPosts();
    }, [navigate]);

    const handleSave = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { name, bio });

            Swal.fire({
                icon: "success",
                title: "Profile Updated!",
                text: "Your profile has been successfully updated.",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
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
                    // Delete post document from Firestore
                    await deleteDoc(doc(db, "posts", postId));

                    // If the post has an image, delete it from Firebase Storage
                    if (imageUrl) {
                        const imageRef = ref(storage, imageUrl);
                        await deleteObject(imageRef);
                    }

                    // Update UI by removing the post
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

    return (
        <div className="profile-container">
            {loading ? (
                <p>Loading profile...</p>
            ) : (
                <>
                    <div className="profile-header">
                        <label htmlFor="profilePicUpload" className="profile-pic-label">
                            <img src={profilePic} alt="Profile" className="profile-pic" />
                        </label>
                        <input
                            type="file"
                            id="profilePicUpload"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => setProfilePic(URL.createObjectURL(e.target.files[0]))}
                        />
                        <h2>{name}</h2>
                        <p className="bio">{bio}</p>
                    </div>

                    <div className="profile-info">
                        <label>Username:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

                        <label>Bio:</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

                        <button onClick={handleSave}>Save Profile</button>
                    </div>

                    {/* Display User's Posts with Delete Option */}
                    <div className="user-posts">
                        <h3>Your Posts</h3>
                        {posts.length === 0 ? (
                            <p>No posts yet.</p>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <p>{post.content}</p>
                                    {post.imageUrl && (
                                        <img src={post.imageUrl} alt="Post" className="post-image" />
                                    )}
                                    <p className="post-time">
                                        Posted on:{" "}
                                        {new Date(post.createdAt.seconds * 1000).toLocaleString()}
                                    </p>

                                    {/* 🗑 Delete Post Button with SweetAlert2 */}
                                    <button
                                        className="delete-post"
                                        onClick={() => handleDeletePost(post.id, post.imageUrl)}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
