import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { addDoc, Timestamp } from "firebase/firestore";
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
    startAfter
} from "firebase/firestore";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useSwipeable } from "react-swipeable";
import CommentsSection from "../components/CommentsSection"; // ✅ Import Comment Section
import "../styles/feed.css";

const Newsfeed = () => {
    const [posts, setPosts] = useState([]);
    const [expandedPosts, setExpandedPosts] = useState({});
    const [commentPost, setCommentPost] = useState(null); // ✅ State for Comment Section
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [likedPost, setLikedPost] = useState(null);
    const observer = useRef();
    const navigate = useNavigate();

    // ✅ Swipe Gesture: Swipe Left to Go to Profile
    const handlers = useSwipeable({
        onSwipedLeft: () => navigate("/profile"),
        trackMouse: true
    });

    useEffect(() => {
        const fetchInitialPosts = async () => {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));

            onSnapshot(q, async (snapshot) => {
                if (!snapshot.empty) {
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

                    setPosts(fetchedPosts);
                    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                }
                setLoading(false);
            });
        };

        fetchInitialPosts();
    }, []);

    const fetchMorePosts = async () => {
        if (!lastVisible || fetchingMore) return;
        setFetchingMore(true);

        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(10));

        onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                const newPosts = await Promise.all(
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

                setPosts((prevPosts) => [...prevPosts, ...newPosts]);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }
            setFetchingMore(false);
        });
    };

    useEffect(() => {
        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMorePosts();
                }
            },
            { threshold: 1 }
        );

        if (observer.current) {
            observer.current.observe(document.querySelector("#loadMoreTrigger"));
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [lastVisible]);

    let tapTimeout = null;
    const handleDoubleTapLike = (postId) => {
        if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;

            setLikedPost(postId);
            setTimeout(() => setLikedPost(null), 800);

            handleLike(postId);
        } else {
            tapTimeout = setTimeout(() => {
                tapTimeout = null;
            }, 300);
        }
    };

   

    const handleLike = async (postId, postOwnerId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const postRef = doc(db, "posts", postId);
        const post = posts.find((p) => p.id === postId);
        const hasLiked = Array.isArray(post.likes) ? post.likes.includes(userId) : false;

        await updateDoc(postRef, {
            likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
        });

        // ✅ Add notification only when liking (not unliking)
        if (!hasLiked) {
            await addDoc(collection(db, "notifications"), {
                receiverId: postOwnerId,
                senderName: auth.currentUser.displayName || "Anonymous",
                type: "like",
                postId: postId,
                timestamp: Timestamp.now(),
                seen: false,
            });

            console.log("🔥 Notification added for like!");
            console.log("🔥 Adding notification for:", post.userId);
        }
    };



    const toggleSeeMore = (postId) => {
        setExpandedPosts((prevState) => ({
            ...prevState,
            [postId]: !prevState[postId],
        }));
    };

    return (
        <div className="newsfeed-container" {...handlers}>
            <h2>Newsfeed</h2>
            {loading && <div className="spinner"></div>}

            {!loading && posts.length === 0 && <p>No posts available.</p>}

            {posts.map((post,index) => (
                <div key={`${post.id}-${index}`} className="post-card" onDoubleClick={() => handleDoubleTapLike(post.id)}>
                    <div className="post-header">
                        <img src={post.userProfilePic} alt="User" className="profile-pic" />
                        <Link to={`/profile/${post.userId}`} className="username">
                            {post.username}
                        </Link>
                        <span className="post-time">
                            {post.createdAt?.seconds
                                ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true })
                                : "Unknown Time"}
                        </span>
                    </div>

                    {post.title && <h3 className="post-title">{post.title}</h3>}

                    {/* ✅ Ensure `post.content` is always a string */}
                    <p>
                        {expandedPosts[post.id] || (typeof post.content === "string" && post.content.length <= 200)
                            ? String(post.content || "No content available")
                            : `${String(post.content || "").slice(0, 200)}... `}
                        {typeof post.content === "string" && post.content.length > 200 && (
                            <span
                                className="see-more"
                                onClick={() => toggleSeeMore(post.id)}
                                style={{ color: "blue", cursor: "pointer" }}
                            >
                                {expandedPosts[post.id] ? " See Less" : " See More"}
                            </span>
                        )}
                    </p>

                    {post.imageUrl && (
                        <div className="post-image-container">
                            <img src={post.imageUrl} alt="Post" className="post-image" loading="lazy" />
                        </div>
                    )}

                    <div className="like-comment-section">
                        <span onClick={() => handleLike(post.id)} className="like-button">
                            {Array.isArray(post.likes) && post.likes.includes(auth.currentUser?.uid) ? (
                                <FaHeart className="liked" />
                            ) : (
                                <FaRegHeart />
                            )}
                        </span>
                        <span className="like-count">{Array.isArray(post.likes) ? post.likes.length : 0} Likes</span>
                        <span className="comment-icon" onClick={() => setCommentPost(post)}>
                            <FaComment />
                            {Array.isArray(post.comments) && post.comments.length > 0 && (
                                <span className="comment-badge">{post.comments.length}</span>
                            )}
                        </span>
                    </div>
                </div>
            ))}



            {commentPost && <CommentsSection post={commentPost} onClose={() => setCommentPost(null)} />}
            <div id="loadMoreTrigger" style={{ height: "20px" }}></div>
        </div>
    );
};

export default Newsfeed;
