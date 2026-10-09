import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Color and Size Selection
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFabric, setSelectedFabric] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  // Available Colors
  const colors = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Pink",
    "Green",
    "Brown",
    "Beige",
  ];

  // Available Sizes
  const sizes = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
  ];

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchProductImages();
  }, []);

  async function fetchProductImages() {
    if (!productId) {
      return;
    }

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Product images error:", error);
      return;
    }

    setProductImages(data || []);
  }

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
    const { data: relatedData, error: relatedError } = await supabase
  .from("products")
  .select("*")
  .eq("category", data.category)
  .neq("id", data.id)
  .limit(4);

if (!relatedError) {
  setRelatedProducts(relatedData || []);
}
    setSelectedImage(data.image_url || "");
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

    // Color required
    if (
  product.category?.toLowerCase() === "clothing" &&
  !selectedColor
) {
  alert("Please select a color");
  return;
}

    // Size required
   if (
  product.category?.toLowerCase() === "clothing" &&
  !selectedSize
) {
  alert("Please select a size");
  return;
}

    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    // Same product + same color + same size
    const existingProduct = cart.find(
      (item) =>
        item.id === product.id &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (existingProduct) {
      if (existingProduct.quantity >= product.stock) {
        alert(
          "❌ Available stock se zyada quantity add nahi kar sakte."
        );
        return;
      }

      const updatedCart = cart.map((item) =>
        item.id === product.id &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
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
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            selectedFabric: selectedFabric,
          },
        ])
      );
    }

    alert(
      `🛒 Product added to cart!\nColor: ${selectedColor}\nSize: ${selectedSize}\nFabric: ${selectedFabric}`
    );
  }

function buyNow() {
  if (!selectedColor) {
    alert("Please select a color.");
    return;
  }

  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  const buyNowItem = {
    ...product,
    quantity: 1,
    selectedColor: selectedColor,
    selectedSize: selectedSize,
  };

  localStorage.setItem(
    "buyNowItem",
    JSON.stringify(buyNowItem)
  );

  window.location.href = "/checkout";
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
                src={selectedImage || product.image_url}
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

            {/* Product Video */}

            {product.video_url && (
              <div style={{ marginTop: "15px" }}>
                <h3>Product Video 🎥</h3>

                <video
                  src={product.video_url}
                  controls
                  playsInline
                  preload="metadata"
                  muted={false}
                  defaultMuted={false}
                  volume={1}
                  style={{
                    width: "100%",
                    maxHeight: "350px",
                    borderRadius: "12px",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Product Gallery */}

            {productImages.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "15px",
                }}
              >
                {productImages.map((image) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={product.name}
                    onClick={() =>
                      setSelectedImage(image.image_url)
                    }
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border:
                        selectedImage === image.image_url
                          ? "2px solid #8b5e3c"
                          : "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  />
                ))}
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
  {product.discount > 0 ? (
    <>
      <span
        style={{
          textDecoration: "line-through",
          color: "#888",
          fontSize: "20px",
          marginRight: "10px",
        }}
      >
        Rs. {product.price}
      </span>

      <strong>
        Rs.{" "}
        {(
          Number(product.price) -
          (Number(product.price) * Number(product.discount)) / 100
        ).toFixed(0)}
      </strong>

      <span
        style={{
          fontSize: "16px",
          marginLeft: "10px",
        }}
      >
        🔥 {product.discount}% OFF
      </span>
    </>
  ) : (
    <>Rs. {product.price}</>
  )}
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

           {/* Color & Size Selection - Clothing Only */}

{product.category?.toLowerCase() === "clothing" && (
  <>
    {/* Color Selection */}

    <div style={{ marginTop: "25px" }}>
      <h3>
        Select Color:{" "}
        <span style={{ color: "#8b5e3c" }}>
          {selectedColor || "None"}
        </span>
      </h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setSelectedColor(color)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border:
                selectedColor === color
                  ? "2px solid #8b5e3c"
                  : "1px solid #ccc",
              background:
                selectedColor === color
                  ? "#f1e2d5"
                  : "white",
              color: "#222",
              cursor: "pointer",
              fontWeight:
                selectedColor === color
                  ? "bold"
                  : "normal",
            }}
          >
            {color}
          </button>
        ))}
      </div>
    </div>

    {/* Size Selection */}

    <div style={{ marginTop: "25px" }}>
      <h3>
        Select Size:{" "}
        <span style={{ color: "#8b5e3c" }}>
          {selectedSize || "None"}
        </span>
      </h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setSelectedSize(size)}
            style={{
              minWidth: "55px",
              padding: "10px 14px",
              borderRadius: "8px",
              border:
                selectedSize === size
                  ? "2px solid #8b5e3c"
                  : "1px solid #ccc",
              background:
                selectedSize === size
                  ? "#f1e2d5"
                  : "white",
              color: "#222",
              cursor: "pointer",
              fontWeight:
                selectedSize === size
                  ? "bold"
                  : "normal",
            }}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  </>
)}
{/* Fabric Selection - Clothing Only */}

{product.category?.toLowerCase() === "clothing" && (
  <div style={{ marginTop: "25px" }}>
    <h3>
      Select Fabric:{" "}
      <span style={{ color: "#8b5e3c" }}>
        {selectedFabric || "None"}
      </span>
    </h3>

    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      {[
        "Cotton",
        "Lawn",
        "Linen",
        "Silk",
        "Chiffon",
        "Organza",
        "Velvet",
        "Khaddar",
        "Denim",
        "Other",
      ].map((fabric) => (
        <button
          key={fabric}
          type="button"
          onClick={() => setSelectedFabric(fabric)}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border:
              selectedFabric === fabric
                ? "2px solid #8b5e3c"
                : "1px solid #ccc",
            background:
              selectedFabric === fabric
                ? "#f1e2d5"
                : "white",
            color: "#222",
            cursor: "pointer",
            fontWeight:
              selectedFabric === fabric
                ? "bold"
                : "normal",
          }}
        >
          {fabric}
        </button>
      ))}
    </div>
  </div>
)}
{Number(product.stock) === 0 ? (
  <p
    style={{
      color: "red",
      fontWeight: "bold",
      fontSize: "18px",
    }}
  >
    ❌ Out of Stock
  </p>
) : Number(product.stock) <= 5 ? (
  <p
    style={{
      color: "#d97706",
      fontWeight: "bold",
      fontSize: "16px",
    }}
  >
    ⚠️ Only {product.stock} left in stock!
  </p>
) : (
  <p
    style={{
      color: "green",
      fontWeight: "bold",
      fontSize: "16px",
    }}
  >
    ✅ In Stock
  </p>
)}
            {/* Wishlist */}

            <button
              onClick={addToWishlist}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: "25px",
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
              disabled={Number(product.stock) === 0}
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
            <button
  onClick={buyNow}
  disabled={Number(product.stock) === 0}
  style={{
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  ⚡ Buy Now
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
            {relatedProducts.length > 0 && (
  <section style={{ marginTop: "50px" }}>
    <h2
      style={{
        textAlign: "center",
        marginBottom: "25px",
      }}
    >
      🛍️ You May Also Like
    </h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
      }}
    >
      {relatedProducts.map((item) => (
        <div
          key={item.id}
          onClick={() =>
            (window.location.href = `/product?id=${item.id}`)
          }
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            cursor: "pointer",
          }}
        >
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              style={{
                width: "100%",
                height: "220px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}

          <h3>{item.name}</h3>

          <p>
            {item.discount > 0 ? (
              <>
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#888",
                    marginRight: "8px",
                  }}
                >
                  Rs. {item.price}
                </span>

                <strong>
                  Rs.{" "}
                  {(
                    Number(item.price) -
                    (Number(item.price) *
                      Number(item.discount)) /
                      100
                  ).toFixed(0)}
                </strong>
              </>
            ) : (
              <>Rs. {item.price}</>
            )}
          </p>
        </div>
      ))}
    </div>
  </section>
)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;