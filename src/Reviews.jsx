import { useState, useEffect } from 'react';
import {
  collection, doc, setDoc, updateDoc,
  deleteDoc, onSnapshot, query,
  orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import useAdmin from './useAdmin';

// ── Star Input (interactive) ──────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? 'filled' : ''}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Star Display (read-only) ──────────────────────────────────────────────────
function StarDisplay({ value }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= value ? 'filled' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Review Form (shared by add + edit) ────────────────────────────────────────
function ReviewForm({ initialRating = 0, initialText = '', onSubmit, onCancel, submitLabel }) {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);

  function handleSubmit() {
    if (rating === 0) return;
    onSubmit({ rating, text: text.trim() });
  }

  return (
    <div className="review-form">
      <p className="form-label">Your Rating</p>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        className="review-textarea"
        placeholder="Write your review (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        rows={4}
      />
      <div className="char-counter">{text.length} / 1000</div>
      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          {submitLabel}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, currentUser, isAdmin, onEdit, onDelete }) {
  const isOwner = currentUser?.uid === review.userId;

  return (
    <div className={`card review-card ${isOwner ? 'own-review' : ''}`}>
      <div className="review-header">
        <span className="review-author">{review.displayName || 'Anonymous'}</span>
        <StarDisplay value={review.rating} />
      </div>
      {review.text ? <p className="review-text">{review.text}</p> : null}
      <div className="review-footer">
        <span className="review-date">
          {review.createdAt?.toDate().toLocaleDateString()}
        </span>
        <div className="review-actions">
          {isOwner && (
            <>
              <button className="btn btn-secondary" onClick={() => onEdit(review)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(review.userId)}>
                Delete
              </button>
            </>
          )}
          {isAdmin && !isOwner && (
            <button className="btn btn-danger" onClick={() => onDelete(review.userId)}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reviews Page ──────────────────────────────────────────────────────────────
function Reviews({ user, onLogin }) {
  const isAdmin = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map((d) => ({ userId: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Pin current user's review to top
  const userReview = user ? reviews.find((r) => r.userId === user.uid) ?? null : null;
  const otherReviews = reviews.filter((r) => r.userId !== user?.uid);

  async function handleAdd({ rating, text }) {
    await setDoc(doc(db, 'reviews', user.uid), {
      userId: user.uid,
      displayName: user.displayName || 'Anonymous',
      rating,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setShowForm(false);
  }

  // Always writes both rating and text — handles star-only → star+text edits cleanly
  async function handleEdit({ rating, text }) {
    await updateDoc(doc(db, 'reviews', editingReview.userId), {
      rating,
      text,
      updatedAt: serverTimestamp(),
    });
    setEditingReview(null);
  }

  async function handleDelete(userId) {
    await deleteDoc(doc(db, 'reviews', userId));
  }

  function handleWriteClick() {
    if (!user) {
      onLogin();
      return;
    }
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="section">
        <p className="section-subtitle">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <section className="section">
        <h1 className="section-title">Reviews</h1>
        <p className="section-subtitle">See what others think about NoDriver4j.</p>

        {/* Write a Review button — always visible, redirects to login if logged out */}
        {!userReview && !showForm && (
          <button className="btn btn-primary" onClick={handleWriteClick}>
            Write a Review
          </button>
        )}

        {/* Add form */}
        {showForm && !userReview && (
          <ReviewForm
            submitLabel="Post Review"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="reviews-list">
          {/* Pinned user review (or edit form in its place) */}
          {userReview && (
            editingReview?.userId === userReview.userId ? (
              <ReviewForm
                initialRating={userReview.rating}
                initialText={userReview.text || ''}
                submitLabel="Save Changes"
                onSubmit={handleEdit}
                onCancel={() => setEditingReview(null)}
              />
            ) : (
              <ReviewCard
                review={userReview}
                currentUser={user}
                isAdmin={isAdmin}
                onEdit={setEditingReview}
                onDelete={handleDelete}
              />
            )
          )}

          {/* All other reviews */}
          {otherReviews.map((review) => (
            <ReviewCard
              key={review.userId}
              review={review}
              currentUser={user}
              isAdmin={isAdmin}
              onEdit={setEditingReview}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {reviews.length === 0 && !showForm && (
          <p className="section-subtitle">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  );
}

export default Reviews;