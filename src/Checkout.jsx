import { useState } from "react";
import { supabase } from "./supabaseClient";

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

  async function handleSubmit(e) {
    e.preventDefault();

    // Step 1: Save customer order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          total: total,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Order error:", orderError);
      alert(`❌ ${orderError.message}`);
      return;
    }

    // Step 2: Save ordered products
    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image_url: item.image_url || "",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);

      alert(
        `⚠️ Order created, but products could not be saved: ${itemsError.message}`
      );

      return;
    }

    // Step 3: Show success message
    localStorage.setItem("customerPhone", customer.phone);
    setOrderPlaced(true);

    // Step 4: Clear cart
    localStorage.removeItem("cart");
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