import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import PropTypes from "prop-types";
import "../styles/comments.css";
import { formatDistanceToNow } from "date-fns";


const CommentsSection = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const commentBoxRef = useRef(null);
    const inputRef = useRef(null);
    const commentsEndRef = useRef(null);

    // Fetch comments in real-time from Firestore
    useEffect(() => {
        if (!post.id) return;

        const postRef = doc(db, "posts", post.id);
        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setComments(docSnap.data().comments || []);
            }
        });

        return () => unsubscribe();
    }, [post.id]);

    // Auto-focus input when comment section opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Auto-scroll to latest comment when new comment is added
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    // Close comment box when clicking outside, but NOT when typing
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commentBoxRef.current && !commentBoxRef.current.contains(event.target)) {
                if (inputRef.current && inputRef.current === document.activeElement) {
                    return;
                }
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);


    // Handle comment submission
    const handleCommentSubmit = useCallback(async () => {
        if (!newComment.trim() || newComment.length > 500) return; // Validate input
        setLoading(true);

        const userId = auth.currentUser?.uid;
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            let username = "Anonymous";
            let userProfilePic = "https://i.pravatar.cc/150";

            if (userSnap.exists()) {
                username = userSnap.data().name || "Anonymous";
                userProfilePic = userSnap.data().photoURL || userProfilePic;
            }

            const postRef = doc(db, "posts", post.id);
            const postSnap = await getDoc(postRef);
            if (!postSnap.exists()) {
                console.error("Post not found. Notification cannot be sent.");
                return;
            }

            const postOwnerId = postSnap.data().userId;
            if (!postOwnerId) {
                console.error("No post owner found! Skipping notification.");
                return;
            }

            const newCommentData = {
                userId,
                username,
                userProfilePic,
                text: newComment.trim(),
                createdAt: Timestamp.now(),
            };

            await updateDoc(postRef, {
                comments: arrayUnion(newCommentData),
            });

            setNewComment(""); // Clear input field

            // Add notification for comment
            await addDoc(collection(db, "notifications"), {
                receiverId: postOwnerId,
                senderName: username,
                type: "comment",
                postId: post.id,
                timestamp: Timestamp.now(),
                seen: false,
            });

            console.log("Notification added for comment!");
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setLoading(false);
        }
    }, [newComment, post.id]);

    // Handle Enter key press
    const handleKeyPress = useCallback(
        (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleCommentSubmit();
            }
        },
        [handleCommentSubmit]
    );

    return (
        <div className="comment-overlay">
            <div className="comment-box" ref={commentBoxRef}>
                <button className="close-btn" onClick={onClose}>✖</button>
                <h3>Comments</h3>

                <div className="comment-list">
                    {comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                                <img src={comment.userProfilePic} alt="User" className="comment-profile-pic" />
                                <div className="comment-content">
                                    <strong>{comment.username}</strong>
                                    <p className="comment-text">{comment.text}</p>
                                    <span className="comment-time">
                                        {comment.createdAt?.seconds
                                            ? formatDistanceToNow(new Date(comment.createdAt.seconds * 1000), { addSuffix: true })
                                            : "Just now"}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-comments">No comments yet.</p>
                    )}

                    <div ref={commentsEndRef}></div>
                </div>

                <div className="comment-input-box">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="comment-input"
                        ref={inputRef}
                        maxLength={500} // Limit comment length
                        disabled={loading}
                    />
                    <button onClick={handleCommentSubmit} className="comment-btn" disabled={loading}>
                        {loading ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
};

CommentsSection.propTypes = {
    post: PropTypes.shape({
        id: PropTypes.string.isRequired,
        userId: PropTypes.string,
        comments: PropTypes.array,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CommentsSection;