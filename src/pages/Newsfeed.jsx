import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc,
    limit,
    deleteDoc
} from "firebase/firestore";
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import "../styles/feed.css";

const Newsfeed = () => {
    const [posts, setPosts] = useState([]);
    const [newComments, setNewComments] = useState({});
    const [expandedPost, setExpandedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Reference for comment input fields
    const commentInputRefs = useRef({});

    useEffect(() => {
        console.log("🔄 Fetching posts from Firestore...");
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedPosts = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const postData = docSnap.data();
                    let username = "Anonymous";
                    let userProfilePic = "https://i.pravatar.cc/40";

                    if (postData.userId) {
                        try {
                            const userRef = doc(db, "users", postData.userId);
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                username = userSnap.data().name || "Anonymous";
                                userProfilePic = userSnap.data().photoURL || userProfilePic;
                            }
                        } catch (error) {
                            console.warn("⚠️ Error fetching user data:", error);
                        }
                    }

                    return { id: docSnap.id, ...postData, username, userProfilePic };
                })
            );

            console.log("✅ Posts successfully loaded:", fetchedPosts);
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            console.log("🔄 Unsubscribing from Firestore...");
            unsubscribe();
        };
    }, []);

    const handleLike = async (postId) => {
        const userId = auth.currentUser.uid;
        const postRef = doc(db, "posts", postId);
        const post = posts.find((p) => p.id === postId);
        const hasLiked = Array.isArray(post.likes) ? post.likes.includes(userId) : false;

        await updateDoc(postRef, {
            likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
        });

        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId
                    ? {
                        ...p,
                        likes: hasLiked
                            ? p.likes.filter((id) => id !== userId)
                            : [...(p.likes || []), userId],
                    }
                    : p
            )
        );
    };

    const handleComment = async (postId) => {
        if (!newComments[postId]?.trim()) return;

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: arrayUnion({
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName || "Anonymous",
                text: newComments[postId],
            }),
        });

        setNewComments({ ...newComments, [postId]: "" });

        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId
                    ? {
                        ...p,
                        comments: [
                            ...p.comments,
                            {
                                userId: auth.currentUser.uid,
                                username: auth.currentUser.displayName || "Anonymous",
                                text: newComments[postId],
                            },
                        ],
                    }
                    : p
            )
        );
    };

    // ✅ Expand comments only for selected post & focus input field
    const expandComments = (postId) => {
        setExpandedPost((prev) => (prev === postId ? null : postId));
        setTimeout(() => {
            if (commentInputRefs.current[postId]) {
                commentInputRefs.current[postId].focus();
            }
        }, 100);
    };

    // ✅ Show Delete Confirmation
    const confirmDelete = (postId) => {
        setDeleteConfirm(postId);
    };

    const handleDelete = async (postId) => {
        try {
            await deleteDoc(doc(db, "posts", postId));
            setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    return (
        <div className="newsfeed-container">
            <h2>Newsfeed</h2>
            {loading && <div className="spinner"></div>}

            {!loading && posts.length === 0 && <p>No posts available.</p>}

            {posts.map((post) => (
                <div key={post.id} className="post-card">
                    <div className="post-header">
                        <img src={post.userProfilePic} alt="User" className="profile-pic" />
                        <span className="username">{post.username}</span>

                        <span className="post-time">
                            {post.createdAt?.seconds
                                ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
                                    addSuffix: true,
                                })
                                : "Unknown Time"}
                        </span>
                    </div>
                    <p>{post.content}</p>

                    {post.userId === auth.currentUser?.uid && (
                        <button className="delete-post" onClick={() => confirmDelete(post.id)}>
                            🗑 Delete
                        </button>
                    )}

                    {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image" loading="lazy" />}

                    <div className="like-comment-section">
                        <span onClick={() => handleLike(post.id)} className="like-button">
                            {Array.isArray(post.likes) && post.likes.includes(auth.currentUser.uid) ? (
                                <FaHeart className="liked" />
                            ) : (
                                <FaRegHeart />
                            )}
                        </span>
                        <span className="like-count">
                            {Array.isArray(post.likes) ? post.likes.length : 0} Likes
                        </span>

                        {/* 🚀 Comment Icon - Expands Comments & Focuses Input */}
                        <span onClick={() => expandComments(post.id)} className="comment-icon">
                            <FaRegComment />
                        </span>
                    </div>

                    {/* 🚀 Expand Comments for Selected Post */}
                    {expandedPost === post.id && (
                        <div className="comment-section">
                            <p><strong>Comments:</strong></p>
                            <div className="comment-box-container">
                                {post.comments?.length > 0 ? (
                                    post.comments.map((comment, index) => (
                                        <p key={index}>
                                            <strong>{comment.username || "User"}:</strong> {comment.text}
                                        </p>
                                    ))
                                ) : (
                                    <p>No comments yet.</p>
                                )}
                            </div>

                            <input
                                type="text"
                                ref={(el) => (commentInputRefs.current[post.id] = el)}
                                className="comment-box"
                                placeholder="Add a comment..."
                                value={newComments[post.id] || ""}
                                onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                            />
                            <button className="comment-button" onClick={() => handleComment(post.id)}>
                                Comment
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* 🚀 Delete Confirmation Popup */}
            {deleteConfirm && (
                <div className="delete-modal">
                    <p>Are you sure you want to delete this post?</p>
                    <button onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
                    <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </div>
            )}
        </div>
    );
};

export default Newsfeed;
