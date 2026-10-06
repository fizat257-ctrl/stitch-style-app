import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [orderItems, setOrderItems] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const phone = localStorage.getItem("customerPhone");

    if (!phone) {
      setMessage("No customer information found.");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage("Unable to load orders.");
      return;
    }

    setOrders(data || []);
    const { data: items, error: itemsError } = await supabase
  .from("order_items")
  .select("*")
  .in(
    "order_id",
    (data || []).map((order) => order.id)
  );

if (itemsError) {
  console.error(itemsError);
  return;
}

const groupedItems = {};

(items || []).forEach((item) => {
  if (!groupedItems[item.order_id]) {
    groupedItems[item.order_id] = [];
  }

  groupedItems[item.order_id].push(item);
});

setOrderItems(groupedItems);
  }

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>My Orders 📦</h1>

      {message && <p>{message}</p>}

      {orders.length === 0 && !message && (
        <p>You have no orders yet.</p>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            padding: "20px",
            marginBottom: "20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Order #{order.id}</h3>

          <p>
            <strong>Status:</strong> {order.status}
          </p>

          <p>
            <strong>Total:</strong> Rs. {order.total}
          </p>

          <p>
            <strong>City:</strong> {order.city}
          </p>

          <p>
            <strong>Address:</strong> {order.address}
          </p>

          <p>
            <strong>Order Date:</strong>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <h4>Ordered Products 🛍️</h4>

{orderItems[order.id]?.length > 0 ? (
  <div style={{ display: "grid", gap: "15px" }}>
    {orderItems[order.id].map((item) => (
      <div
        key={item.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          padding: "12px",
          background: "#f8f8f8",
          borderRadius: "10px",
        }}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            style={{
              width: "90px",
              height: "90px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        ) : (
          <div
            style={{
              width: "90px",
              height: "90px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eee",
              borderRadius: "8px",
              fontSize: "30px",
            }}
          >
            🛍️
          </div>
        )}

        <div>
          <h4 style={{ margin: "0 0 8px 0" }}>
            {item.product_name}
          </h4>

          <p style={{ margin: "4px 0" }}>
            Price: Rs. {item.price}
          </p>

          <p style={{ margin: "4px 0" }}>
            Quantity: {item.quantity}
          </p>

          <p style={{ margin: "4px 0", fontWeight: "bold" }}>
            Subtotal: Rs.{" "}
            {Number(item.price) * item.quantity}
          </p>
        </div>
      </div>
    ))}
  </div>
) : (
  <p>No product details available.</p>
)}
        </div>
      ))}
    </div>
  );
}

export default MyOrders;