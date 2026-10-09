import { useEffect, useState } from "react";

function Cart() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Unique identity for product + color + size + measurements
  function getItemKey(item) {
    return `${item.id}-${item.selectedColor || ""}-${
      item.selectedSize || ""
    }-${JSON.stringify(item.customMeasurements || {})}`;
  }

  function increaseQuantity(item) {
    if (item.quantity >= item.stock) {
      alert(
        "❌ Available stock se zyada quantity add nahi kar sakte."
      );
      return;
    }

    const itemKey = getItemKey(item);

    setCart(
      cart.map((cartItem) =>
        getItemKey(cartItem) === itemKey
          ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
          : cartItem
      )
    );
  }

  function decreaseQuantity(item) {
    const itemKey = getItemKey(item);

    setCart(
      cart
        .map((cartItem) =>
          getItemKey(cartItem) === itemKey
            ? {
                ...cartItem,
                quantity: cartItem.quantity - 1,
              }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  }

  function removeItem(item) {
    const itemKey = getItemKey(item);

    setCart(
      cart.filter(
        (cartItem) => getItemKey(cartItem) !== itemKey
      )
    );
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "auto",
      }}
    >
      <h1>Shopping Cart 🛒</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={getItemKey(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "15px",
                marginBottom: "15px",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                flexWrap: "wrap",
              }}
            >
              {/* Product Image */}

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}

              {/* Product Information */}

              <div style={{ flex: 1, minWidth: "180px" }}>
                <h3>{item.name}</h3>

                <p>
                  Price: <strong>Rs. {item.price}</strong>
                </p>

                {/* Color */}

                {item.selectedColor && (
                  <p>
                    <strong>Color:</strong>{" "}
                    {item.selectedColor}
                  </p>
                )}

                {/* Size */}

                {item.selectedSize && (
                  <p>
                    <strong>Size:</strong>{" "}
                    {item.selectedSize}
                  </p>
                )}

                {/* Custom Measurements */}

                {item.customMeasurements &&
                  Object.values(item.customMeasurements).some(
                    (value) => String(value).trim() !== ""
                  ) && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "#fff8f2",
                        border: "1px solid #ead8c8",
                        borderRadius: "8px",
                      }}
                    >
                      <strong>Custom Measurements</strong>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(120px, 1fr))",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {Object.entries(
                          item.customMeasurements
                        ).map(([key, value]) =>
                          String(value).trim() !== "" ? (
                            <p
                              key={key}
                              style={{
                                margin: "2px 0",
                                fontSize: "14px",
                              }}
                            >
                              <strong>
                                {key.charAt(0).toUpperCase() +
                                  key.slice(1)}:
                              </strong>{" "}
                              {value} inches
                            </p>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                {/* Fabric */}

                {item.selectedFabric && (
                  <p>
                    <strong>Fabric:</strong>{" "}
                    {item.selectedFabric}
                  </p>
                )}

                <p>
                  Available Stock: {item.stock}
                </p>

                {/* Quantity */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <button
                    onClick={() => decreaseQuantity(item)}
                    style={{
                      width: "35px",
                      height: "35px",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    −
                  </button>

                  <span
                    style={{
                      margin: "0 15px",
                      fontWeight: "bold",
                    }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item)}
                    style={{
                      width: "35px",
                      height: "35px",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove */}

              <button
                onClick={() => removeItem(item)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Total */}

          <h2>Total: Rs. {total}</h2>

          {/* Checkout */}

          <a href="/checkout">
            <button
              style={{
                padding: "12px 25px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Proceed to Checkout
            </button>
          </a>
        </>
      )}
    </div>
  );
}

export default Cart;