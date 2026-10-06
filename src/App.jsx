import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";
import Cart from "./Cart";
import Checkout from "./Checkout";
import MyOrders from "./MyOrders.jsx";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const path = window.location.pathname;

  const isAdmin = path === "/admin";
  const isAdminLogin = path === "/admin-login";
  const isCart = path === "/cart";
  const isCheckout = path === "/checkout";
  const isMyOrders = path === "/my-orders";

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isAdmin && !isAdminLogin && !isCart && !isCheckout) {
      fetchProducts();
    }
  }, [isAdmin, isAdminLogin, isCart, isCheckout]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
      console.log("PRODUCTS:"), data;

    if (error) {
      console.error("Products error:", error);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }

  function addToCart(product) {
    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (existingProduct) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }

    alert(`${product.name} added to cart!`);
  }

  // Admin Login
  if (isAdminLogin) {
    return <AdminLogin />;
  }

  // Admin Dashboard
  if (isAdmin) {
    return <Admin />;
  }

  // Cart Page
  if (isCart) {
    return <Cart />;
  }

  // Checkout Page
  if (isCheckout) {
    return <Checkout />;
  }
  if (isMyOrders) {
  return <MyOrders />;
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7f5",
        color: "#222",
      }}
    >
      {/* Header */}

      <header
        style={{
          padding: "20px 40px",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eee",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h1 style={{ margin: 0 }}>Stitch & Style</h1>

        <nav
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#222",
            }}
          >
            Home
          </a>

          <a
            href="/#products"
            style={{
              textDecoration: "none",
              color: "#222",
            }}
          >
            Products
          </a>

          <a
            href="/cart"
            style={{
              textDecoration: "none",
              color: "#222",
              fontWeight: "bold",
            }}
          >
            🛒 Cart (
            {cart.reduce(
              (total, item) => total + item.quantity,
              0
            )}
            )
          </a>

<a
  href="/my-orders"
  style={{
    textDecoration: "none",
    color: "#222",
    fontWeight: "bold",
  }}
>
  📦 My Orders
</a>
          <a
            href="/admin-login"
            style={{
              textDecoration: "none",
              color: "#222",
            }}
          >
            Admin
          </a>
        </nav>
      </header>

      {/* Hero */}

      <section
        style={{
          textAlign: "center",
          padding: "70px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "42px",
            marginBottom: "15px",
          }}
        >
          Welcome to Stitch & Style
        </h2>

        <p
          style={{
            fontSize: "18px",
            maxWidth: "650px",
            margin: "auto",
            lineHeight: "1.6",
          }}
        >
          Discover beautiful women's clothing and handmade crochet
          products, all in one place.
        </p>
      </section>

      {/* Products */}

      <section
        id="products"
        style={{
          maxWidth: "1100px",
          margin: "auto",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          Our Products
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center" }}>
            No products available.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "25px",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "white",
                  borderRadius: "15px",
                  padding: "15px",
                  boxShadow:
                    "0 5px 20px rgba(0,0,0,0.08)",
                }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "280px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "280px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f1ece8",
                      borderRadius: "12px",
                      fontSize: "50px",
                    }}
                  >
                    🛍️
                  </div>
                )}

                <h3 style={{ marginTop: "15px" }}>
                  {product.name}
                </h3>

                <p>{product.description}</p>

                <p>
                  <strong>Rs. {product.price}</strong>
                </p>

                <p>
                  Category: {product.category}
                </p>

                <p>
                  {product.stock > 0
                    ? `In Stock: ${product.stock}`
                    : "Out of Stock"}
                </p>

                {/* Add to Cart */}

                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    border: "none",
                    borderRadius: "8px",
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
              </div>
            ))}
          </div>
        )}
      </section>
      {/* WhatsApp Button */}

      <a
        href="https://wa.me/923043093334?text=Hello%20Stitch%20%26%20Style%2C%20I%20want%20to%20ask%20about%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#25D366",
          color: "white",
          width: "55px",
          height: "55px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          zIndex: 1000,
        }}
      >
        💬
      </a>

      {/* Footer */}

      <footer>
        ...
      </footer>

      {/* Footer */}

      <footer
        style={{
          marginTop: "70px",
          padding: "30px",
          background: "#222",
          color: "white",
          textAlign: "center",
        }}
      >
        <p>
          © 2026 Stitch & Style. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;