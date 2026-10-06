import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, []);

  async function fetchProduct() {
    if (!productId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) {
      console.error("Product error:", error);
      setLoading(false);
      return;
    }

    setProduct(data);
    setLoading(false);
  }

  async function fetchReviews() {
    if (!productId) {
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Reviews error:", error);
      return;
    }

    setReviews(data || []);
  }

  function addToCart() {
    if (product.stock <= 0) {
      alert("❌ This product is out of stock.");
      return;
    }

    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (existingProduct) {
      if (existingProduct.quantity >= product.stock) {
        alert(
          "❌ Available stock se zyada quantity add nahi kar sakte."
        );
        return;
      }

      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );

      localStorage.setItem(
        "cart",
        JSON.stringify(updatedCart)
      );
    } else {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          ...cart,
          {
            ...product,
            quantity: 1,
          },
        ])
      );
    }

    alert("🛒 Product added to cart!");
  }

  function addToWishlist() {
    const wishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    );

    const alreadyAdded = wishlist.some(
      (item) => item.id === product.id
    );

    if (alreadyAdded) {
      alert("❤️ Already in Wishlist");
      return;
    }

    localStorage.setItem(
      "wishlist",
      JSON.stringify([
        ...wishlist,
        product,
      ])
    );

    alert("❤️ Added to Wishlist!");
  }

  async function submitReview(e) {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a review.");
      return;
    }

    setReviewLoading(true);

    const { error } = await supabase
      .from("reviews")
      .insert([
        {
          product_id: Number(productId),
          customer_name: customerName.trim(),
          rating: Number(rating),
          comment: comment.trim(),
        },
      ]);

    if (error) {
      console.error("Review submit error:", error);
      alert(`❌ ${error.message}`);
      setReviewLoading(false);
      return;
    }

    alert("⭐ Review submitted successfully!");

    setCustomerName("");
    setRating(5);
    setComment("");

    await fetchReviews();

    setReviewLoading(false);
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + Number(review.rating),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <p
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading product...
      </p>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          padding: "20px",
        }}
      >
        <h2>Product not found.</h2>

        <a href="/">
          ← Back to Products
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7f5",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        {/* Back Button */}

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "bold",
          }}
        >
          ← Back to Products
        </a>

        {/* Product Details */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px",
            marginTop: "30px",
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Product Image */}

          <div>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "450px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
            ) : (
              <div
                style={{
                  height: "450px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f1ece8",
                  borderRadius: "12px",
                  fontSize: "70px",
                }}
              >
                🛍️
              </div>
            )}
          </div>

          {/* Product Information */}

          <div>
            <h1>{product.name}</h1>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#8b5e3c",
              }}
            >
              Rs. {product.price}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {product.category}
            </p>

            <p>
              <strong>Stock:</strong>{" "}
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of Stock"}
            </p>

            <hr
              style={{
                margin: "20px 0",
                border: "none",
                borderTop: "1px solid #eee",
              }}
            />

            <h3>Description</h3>

            <p
              style={{
                lineHeight: "1.7",
                color: "#555",
              }}
            >
              {product.description}
            </p>

            {/* Wishlist */}

            <button
              onClick={addToWishlist}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: "20px",
                background: "white",
                color: "#b33",
                border: "1px solid #b33",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ❤️ Add to Wishlist
            </button>

            {/* Cart */}

            <button
              onClick={addToCart}
              disabled={product.stock <= 0}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor:
                  product.stock > 0
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {product.stock > 0
                ? "🛒 Add to Cart"
                : "Out of Stock"}
            </button>
          </div>
        </div>

        {/* Reviews Section */}

        <div
          style={{
            marginTop: "40px",
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2>⭐ Customer Reviews</h2>

          <p
            style={{
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            {averageRating} / 5 ⭐
          </p>

          <p>
            {reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"}
          </p>

          {/* Review Form */}

          <form onSubmit={submitReview}>
            <input
              type="text"
              placeholder="Your name"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
              }}
            />

            <select
              value={rating}
              onChange={(e) =>
                setRating(Number(e.target.value))
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
              <option value={3}>⭐⭐⭐ 3 Stars</option>
              <option value={2}>⭐⭐ 2 Stars</option>
              <option value={1}>⭐ 1 Star</option>
            </select>

            <textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              rows="5"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />

            <button
              type="submit"
              disabled={reviewLoading}
              style={{
                width: "100%",
                padding: "13px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {reviewLoading
                ? "Submitting..."
                : "⭐ Submit Review"}
            </button>
          </form>

          {/* Existing Reviews */}

          <div style={{ marginTop: "30px" }}>
            {reviews.length === 0 ? (
              <p>
                No reviews yet. Be the first to review
                this product! ⭐
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: "15px 0",
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <strong>
                    {review.customer_name}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0",
                    }}
                  >
                    {"⭐".repeat(review.rating)}
                  </p>

                  <p
                    style={{
                      color: "#555",
                      lineHeight: "1.5",
                    }}
                  >
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;