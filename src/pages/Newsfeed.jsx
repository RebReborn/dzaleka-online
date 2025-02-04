import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import "../styles/feed.css";

const Newsfeed = () => {
    const [posts, setPosts] = useState([]);
    const [newComments, setNewComments] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            setPosts((prevPosts) => {
                const prevPostIds = new Set(prevPosts.map((post) => post.id));
                const updatedPosts = newPosts.map((post) => ({
                    ...post,
                    likes: post.likes || [],
                    comments: post.comments || [],
                }));

                // Only update if there's a new post or change in existing posts
                if (newPosts.length !== prevPosts.length || !prevPostIds.has(newPosts[0]?.id)) {
                    return updatedPosts;
                }
                return prevPosts;
            });

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLike = async (postId) => {
        const userId = auth.currentUser.uid;
        const postRef = doc(db, "posts", postId);
        const post = posts.find((p) => p.id === postId);
        const hasLiked = post.likes?.includes(userId);

        await updateDoc(postRef, {
            likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
        });

        // Update UI instantly to prevent flickering
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId
                    ? { ...p, likes: hasLiked ? p.likes.filter((id) => id !== userId) : [...p.likes, userId] }
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
                text: newComments[postId],
            }),
        });

        setNewComments({ ...newComments, [postId]: "" });

        // Update UI instantly to prevent flickering
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId
                    ? { ...p, comments: [...p.comments, { userId: auth.currentUser.uid, text: newComments[postId] }] }
                    : p
            )
        );
    };

    return (
        <div className="newsfeed-container">
            <h2>Newsfeed</h2>
            {loading ? <p>Loading posts...</p> : null}
            {!loading && posts.length === 0 ? <p>No posts available.</p> : null}

            {posts.map((post) => (
                <div key={post.id} className="post-card">
                    <p>{post.content}</p>
                    {post.imageUrl && <img src={post.imageUrl} alt="Post" />}

                    {/* Like Section */}
                    <div className="like-comment-section">
                        <button className="like-button" onClick={() => handleLike(post.id)}>
                            {post.likes?.includes(auth.currentUser.uid) ? "Unlike" : "Like"} ({post.likes?.length || 0})
                        </button>
                    </div>

                    {/* Comment Section */}
                    <div className="comment-section">
                        {post.comments?.map((comment, index) => (
                            <p key={index}><strong>User:</strong> {comment.text}</p>
                        ))}
                        <input
                            type="text"
                            className="comment-box"
                            placeholder="Add a comment..."
                            value={newComments[post.id] || ""}
                            onChange={(e) => setNewComments({ ...newComments, [postId]: e.target.value })}
                        />
                        <button className="comment-button" onClick={() => handleComment(post.id)}>Comment</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Newsfeed;
