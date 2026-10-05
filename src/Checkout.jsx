import { useState } from "react";

function Checkout() {
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  function handleChange(e) {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    setOrderPlaced(true);
  }

  if (cart.length === 0) {
    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "80px auto",
          padding: "30px",
          textAlign: "center",
        }}
      >
        <h1>Your Cart is Empty 🛒</h1>

        <a href="/">
          <button style={{ padding: "12px 25px" }}>
            Continue Shopping
          </button>
        </a>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "80px auto",
          padding: "30px",
          textAlign: "center",
        }}
      >
        <h1>🎉 Order Received!</h1>

        <p>
          Thank you, {customer.name}.
        </p>

        <p>
          We will contact you on <strong>{customer.phone}</strong>.
        </p>

        <p>
          Your total is <strong>Rs. {total}</strong>.
        </p>

        <a href="/">
          <button style={{ padding: "12px 25px" }}>
            Continue Shopping
          </button>
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "50px auto",
        padding: "30px",
      }}
    >
      <h1>Checkout 🛍️</h1>

      <h2>Total: Rs. {total}</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Full Name</label>

          <input
            type="text"
            name="name"
            value={customer.name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Phone Number</label>

          <input
            type="tel"
            name="phone"
            value={customer.phone}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Complete Address</label>

          <textarea
            name="address"
            value={customer.address}
            onChange={handleChange}
            required
            rows="4"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>City</label>

          <input
            type="text"
            name="city"
            value={customer.city}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Place Order
        </button>
      </form>
    </div>
  );
}

export default Checkout;