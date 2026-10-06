import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  useEffect(() => {
    fetchProduct();
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

            {/* Wishlist Button */}

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

            {/* Cart Button */}

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
      </div>
    </div>
  );
}

export default ProductDetails;