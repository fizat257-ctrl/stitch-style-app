import { useEffect, useState } from "react";

function Wishlist() {
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  function removeFromWishlist(id) {
    setWishlist(
      wishlist.filter((item) => item.id !== id)
    );
  }

  function addToCart(product) {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (product.stock <= 0) {
      alert("❌ This product is out of stock.");
      return;
    }

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

    alert("🛒 Added to Cart!");
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>My Wishlist ❤️</h1>

      {wishlist.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
          }}
        >
          <h2>Your wishlist is empty ❤️</h2>

          <p>
            Add your favorite products to your wishlist.
          </p>

          <a href="/">
            <button
              style={{
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🛍️ Browse Products
            </button>
          </a>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          {wishlist.map((product) => (
            <div
              key={product.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "12px",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "220px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#eee",
                    borderRadius: "10px",
                    fontSize: "50px",
                  }}
                >
                  🛍️
                </div>
              )}

              <h3>{product.name}</h3>

              <p>{product.description}</p>

              <p>
                <strong>
                  Rs. {product.price}
                </strong>
              </p>

              <p>
                {product.stock > 0
                  ? `In Stock: ${product.stock}`
                  : "Out of Stock"}
              </p>

              <button
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "8px",
                  cursor:
                    product.stock > 0
                      ? "pointer"
                      : "not-allowed",
                  fontWeight: "bold",
                }}
              >
                {product.stock > 0
                  ? "🛒 Add to Cart"
                  : "Out of Stock"}
              </button>

              <button
                onClick={() =>
                  removeFromWishlist(product.id)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#b33",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                🗑️ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;