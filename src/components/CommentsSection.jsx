import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import PropTypes from "prop-types"; // ✅ Import PropTypes
import "../styles/comments.css";

const CommentsSection = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const commentBoxRef = useRef(null);
    const inputRef = useRef(null);
    const commentsEndRef = useRef(null);

    // ✅ Fetch comments in real-time from Firestore
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

    // ✅ Auto-focus input when comment section opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // ✅ Auto-scroll to latest comment when new comment is added
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    // ✅ Close comment box when clicking outside, but NOT when typing
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commentBoxRef.current && !commentBoxRef.current.contains(event.target)) {
                if (inputRef.current && inputRef.current === document.activeElement) {
                    return; // Don't close if input is active
                }
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        let username = "Anonymous";

        if (userSnap.exists()) {
            username = userSnap.data().name || "Anonymous";
        }

        // ✅ Get the post owner's user ID
        const postRef = doc(db, "posts", post.id);
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) {
            console.error("❌ Post not found. Notification cannot be sent.");
            return;
        }

        const postOwnerId = postSnap.data().userId;
        if (!postOwnerId) {
            console.error("❌ No post owner found! Skipping notification.");
            return;
        }

        const newCommentData = {
            userId,
            username,
            text: newComment,
            createdAt: Timestamp.now(),
        };

        await updateDoc(postRef, {
            comments: arrayUnion(newCommentData),
        });

        setComments((prevComments) => [...prevComments, newCommentData]);

        // ✅ Add notification for comment (only if postOwnerId exists)
        await addDoc(collection(db, "notifications"), {
            receiverId: postOwnerId, // ✅ Ensure this exists!
            senderName: username,
            type: "comment",
            postId: post.id,
            timestamp: Timestamp.now(),
            seen: false,
        });

        console.log("🔥 Notification added for comment!");
    };







    return (
        <div className="comment-overlay">
            <div className="comment-box" ref={commentBoxRef}>
                <button className="close-btn" onClick={onClose}>✖</button>
                <h3>Comments</h3>

                {/* ✅ Scrollable Comment List */}
                <div className="comment-list">
                    {comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                                <img src={comment.userProfilePic} alt="User" className="comment-profile-pic" />
                                <div className="comment-content">
                                    <strong>{comment.username}</strong>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-comments">No comments yet.</p>
                    )}
                    <div ref={commentsEndRef}></div> {/* ✅ Auto-scroll to this element */}
                </div>

                {/* ✅ Comment Input Field */}
                <div className="comment-input-box">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="comment-input"
                        ref={inputRef}
                    />
                    <button onClick={handleCommentSubmit} className="comment-btn">Post</button>
                </div>
            </div>
        </div>
    );

};

CommentsSection.propTypes = {
    post: PropTypes.shape({
        id: PropTypes.string.isRequired, // Ensures post has an ID
        userId: PropTypes.string, // Optional but recommended
        comments: PropTypes.array, // Ensures comments are an array
    }).isRequired,
    onClose: PropTypes.func.isRequired, // Ensures `onClose` is a function
};

export default CommentsSection;
