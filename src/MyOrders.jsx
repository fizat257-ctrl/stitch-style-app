import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

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
        </div>
      ))}
    </div>
  );
}

export default MyOrders;