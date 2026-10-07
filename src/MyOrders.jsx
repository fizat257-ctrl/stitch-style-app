import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [orderItems, setOrderItems] = useState({});
  const [stitchingRequests, setStitchingRequests] = useState([]);
  const [stitchingMessage, setStitchingMessage] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  function normalizePhone(phone) {
    if (!phone) return "";

    let cleaned = phone
      .toString()
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    // +92XXXXXXXXXX → 03XXXXXXXXX
    if (cleaned.startsWith("+92")) {
      cleaned = "0" + cleaned.substring(3);
    }

    // 92XXXXXXXXXX → 03XXXXXXXXX
    if (
      cleaned.startsWith("92") &&
      cleaned.length === 12
    ) {
      cleaned = "0" + cleaned.substring(2);
    }

    return cleaned;
  }

  async function fetchOrders() {
    const storedPhone =
      localStorage.getItem("customerPhone");

    const phone = normalizePhone(storedPhone);

    console.log("MyOrders stored phone:", storedPhone);
    console.log("MyOrders normalized phone:", phone);

    if (!phone) {
      setMessage("No customer information found.");
      return;
    }

    // =========================
    // Fetch Orders
    // =========================

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders error:", error);
      setMessage("Unable to load orders.");
      return;
    }

    setOrders(data || []);

    // =========================
    // Fetch Order Items
    // =========================

    if ((data || []).length > 0) {
      const { data: items, error: itemsError } =
        await supabase
          .from("order_items")
          .select("*")
          .in(
            "order_id",
            (data || []).map((order) => order.id)
          );

      if (itemsError) {
        console.error(
          "Order items error:",
          itemsError
        );
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

    // =========================
    // Fetch Custom Stitching Requests
    // =========================

    const {
      data: stitchingData,
      error: stitchingError,
    } = await supabase
      .from("custom_stitching_requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (stitchingError) {
      console.error(
        "Stitching requests error:",
        stitchingError
      );

      setStitchingMessage(
        "Unable to load custom stitching requests."
      );

      return;
    }

    // Match phone numbers after fetching requests
    const matchedRequests = (stitchingData || []).filter(
      (request) =>
        normalizePhone(request.phone) === phone
    );

    console.log(
      "All stitching requests:",
      stitchingData
    );

    console.log(
      "Matched stitching requests:",
      matchedRequests
    );

    setStitchingRequests(matchedRequests);

    if (matchedRequests.length === 0) {
      setStitchingMessage(
        "No custom stitching request found for this phone number."
      );
    } else {
      setStitchingMessage("");
    }
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>My Orders 📦</h1>

      {message && <p>{message}</p>}

      {orders.length === 0 && !message && (
        <p>You have no orders yet.</p>
      )}

      {/* =========================
          ORDERS
      ========================= */}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            padding: "20px",
            marginBottom: "20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Order #{order.id}</h3>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "20px",
                fontWeight: "bold",
                textTransform: "capitalize",
                background:
                  order.status === "pending"
                    ? "#fff3cd"
                    : order.status === "confirmed"
                    ? "#cfe2ff"
                    : order.status === "shipped"
                    ? "#d1ecf1"
                    : order.status === "delivered"
                    ? "#d4edda"
                    : order.status === "cancelled"
                    ? "#f8d7da"
                    : "#eee",
                color:
                  order.status === "pending"
                    ? "#856404"
                    : order.status === "confirmed"
                    ? "#084298"
                    : order.status === "shipped"
                    ? "#0c5460"
                    : order.status === "delivered"
                    ? "#155724"
                    : order.status === "cancelled"
                    ? "#721c24"
                    : "#333",
              }}
            >
              {order.status}
            </span>
          </p>

          <p>
            <strong>Total:</strong> Rs.{" "}
            {order.total}
          </p>

          <p>
            <strong>City:</strong> {order.city}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {order.address}
          </p>

          <p>
            <strong>Order Date:</strong>{" "}
            {new Date(
              order.created_at
            ).toLocaleString()}
          </p>

          <h4>Ordered Products 🛍️</h4>

          {orderItems[order.id]?.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "15px",
              }}
            >
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
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                      }}
                    >
                      {item.product_name}
                    </h4>

                    <p style={{ margin: "4px 0" }}>
                      Price: Rs. {item.price}
                    </p>

                    <p style={{ margin: "4px 0" }}>
                      Quantity: {item.quantity}
                    </p>

                    <p
                      style={{
                        margin: "4px 0",
                        fontWeight: "bold",
                      }}
                    >
                      Subtotal: Rs.{" "}
                      {Number(item.price) *
                        item.quantity}
                    </p>

                    {item.selected_color && (
                      <p
                        style={{
                          margin: "4px 0",
                        }}
                      >
                        Color:{" "}
                        {item.selected_color}
                      </p>
                    )}

                    {item.selected_size && (
                      <p
                        style={{
                          margin: "4px 0",
                        }}
                      >
                        Size:{" "}
                        {item.selected_size}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No product details available.</p>
          )}
        </div>
      ))}

      {/* =========================
          CUSTOM STITCHING REQUESTS
      ========================= */}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#8b5e3c" }}>
          🧵 My Custom Stitching Requests
        </h2>

        {stitchingMessage && (
          <p style={{ color: "#666" }}>
            {stitchingMessage}
          </p>
        )}

        {stitchingRequests.length > 0 &&
          stitchingRequests.map((request) => (
            <div
              key={request.id}
              style={{
                marginTop: "15px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                background: "#fafafa",
              }}
            >
              <h3>
                {request.product_name ||
                  "Custom Stitching"}
              </h3>

              <p>
                <strong>Customer:</strong>{" "}
                {request.customer_name}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {request.phone}
              </p>

              <p>
                <strong>Size:</strong>{" "}
                {request.size || "N/A"}
              </p>

              <p>
                <strong>Measurements:</strong>
                <br />
                {request.measurements ||
                  "N/A"}
              </p>

              <p>
                <strong>Instructions:</strong>
                <br />
                {request.stitching_instructions ||
                  "N/A"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    background:
                      request.status ===
                      "Completed"
                        ? "#d4edda"
                        : request.status ===
                          "In Progress"
                        ? "#cfe2ff"
                        : request.status ===
                          "Confirmed"
                        ? "#d1ecf1"
                        : request.status ===
                          "Cancelled"
                        ? "#f8d7da"
                        : "#fff3cd",
                    color:
                      request.status ===
                      "Completed"
                        ? "#155724"
                        : request.status ===
                          "In Progress"
                        ? "#084298"
                        : request.status ===
                          "Confirmed"
                        ? "#0c5460"
                        : request.status ===
                          "Cancelled"
                        ? "#721c24"
                        : "#856404",
                  }}
                >
                  {request.status ||
                    "Pending"}
                </span>
              </p>

              {request.reference_image_url && (
                <div
                  style={{
                    marginTop: "10px",
                  }}
                >
                  <strong>
                    Reference Design:
                  </strong>
                  <br />

                  <img
                    src={
                      request.reference_image_url
                    }
                    alt="Reference Design"
                    style={{
                      width: "180px",
                      maxHeight: "220px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginTop: "8px",
                    }}
                  />
                </div>
              )}

              <p
                style={{
                  color: "#777",
                  fontSize: "13px",
                  marginTop: "12px",
                }}
              >
                Submitted:{" "}
                {request.created_at
                  ? new Date(
                      request.created_at
                    ).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default MyOrders;