import { useState } from "react";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";

function Checkout() {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState(
    "Cash on Delivery"
  );

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [newsletterEmail, setNewsletterEmail] = useState("");
const [subscribeToNews, setSubscribeToNews] = useState(false);

  const buyNowItem = JSON.parse(
    localStorage.getItem("buyNowItem") || "null"
  );

  const cart = buyNowItem
    ? [buyNowItem]
    : JSON.parse(localStorage.getItem("cart") || "[]");

  // Product Total
  const productTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity || 0),
    0
  );

  // Subtotal: No delivery fee
  const subtotal = productTotal;

  // Final Total
  const total = subtotal;

  function handleChange(e) {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  }

  function generateInvoice(order) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Stitch & Style", 20, 20);

    doc.setFontSize(14);
    doc.text("Order Invoice / Receipt", 20, 32);

    doc.setFontSize(11);

    doc.text(`Order ID: ${order.id}`, 20, 48);
    doc.text(`Customer: ${customer.name}`, 20, 58);
    doc.text(`Phone: ${customer.phone}`, 20, 68);
    doc.text(`Address: ${customer.address}`, 20, 78);
    doc.text(`City: ${customer.city}`, 20, 88);

    doc.text(
      `Payment Method: ${paymentMethod}`,
      20,
      100
    );

    doc.text(
      `Product Total: Rs. ${productTotal}`,
      20,
      112
    );

    doc.text(
      `Subtotal: Rs. ${subtotal}`,
      20,
      122
    );

    doc.text(
      `Final Total: Rs. ${total}`,
      20,
      132
    );

    doc.text(
      `Date: ${new Date().toLocaleString()}`,
      20,
      144
    );

    doc.setFontSize(13);
    doc.text(
      "Thank you for shopping with Stitch & Style!",
      20,
      165
    );

    doc.save(`Stitch-Style-Order-${order.id}.pdf`);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const stockError = cart.some(
      (item) => Number(item.quantity) > Number(item.stock)
    );

    if (stockError) {
      alert(
        "❌ Some products are no longer available in the requested quantity. Please update your cart."
      );
      return;
    }

    // Check current Supabase session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("SESSION:", session);
    console.log("SESSION ERROR:", sessionError);

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
          payment_method: paymentMethod,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.log(
        "ORDER ERROR MESSAGE:",
        orderError?.message
      );
      console.log(
        "ORDER ERROR CODE:",
        orderError?.code
      );
      console.log(
        "ORDER ERROR DETAILS:",
        orderError?.details
      );
      console.log(
        "ORDER ERROR HINT:",
        orderError?.hint
      );

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

      // Selected product options
      selected_color: item.selectedColor || "",
      selected_size: item.selectedSize || "",
      selected_fabric: item.selectedFabric || "",
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

    // Step 3: Reduce product stock
    for (const item of cart) {
      console.log("STOCK DEBUG:", {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
      });

      const { error: stockError } = await supabase.rpc(
        "reduce_product_stock",
        {
          p_product_id: item.id,
          p_quantity: item.quantity,
        }
      );

      if (stockError) {
        console.error("STOCK UPDATE ERROR FULL:", {
          message: stockError?.message,
          code: stockError?.code,
          details: stockError?.details,
          hint: stockError?.hint,
        });

        alert(
          `❌ Stock update failed: ${stockError.message}`
        );

        return;
      }
    }

    // Step 4: Save customer phone
    localStorage.setItem(
      "customerPhone",
      customer.phone
    );

    // Step 5: Show success
    setCompletedOrder(order);
    setOrderPlaced(true);

    // Step 6: Clear cart
    localStorage.removeItem("cart");
    localStorage.removeItem("buyNowItem");
  }

  // Empty Cart
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

  // Order Success
  if (orderPlaced) {
    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "50px auto",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#9a6248",
          }}
        >
          Stitch & Style
        </h1>

        <h2 style={{ textAlign: "center" }}>
          🎉 Order Received!
        </h2>

        <p>
          Thank you, {customer.name}.
        </p>

        <p>
          We will contact you on{" "}
          <strong>{customer.phone}</strong>.
        </p>

        <p>
          Product Total:{" "}
          <strong>Rs. {productTotal}</strong>
        </p>

        <p>
          Subtotal:{" "}
          <strong>Rs. {subtotal}</strong>
        </p>

        <p>
          Final Total:{" "}
          <strong>Rs. {total}</strong>
        </p>

        <p>
          Payment Method:{" "}
          <strong>{paymentMethod}</strong>
        </p>

        {paymentMethod === "EasyPaisa" && (
          <div
            style={{
              margin: "25px auto",
              padding: "20px",
              maxWidth: "350px",
              background: "#f8f8f8",
              borderRadius: "15px",
              border: "1px solid #ddd",
              textAlign: "center",
            }}
          >
            <h3>EasyPaisa Payment</h3>

            <p>
              Please scan the QR code to complete your
              payment.
            </p>

            <img
              src="/easypaisa-qr.png"
              alt="EasyPaisa QR Code"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
                display: "block",
                margin: "15px auto",
              }}
            />

            <p>
              <strong>Amount: Rs. {total}</strong>
            </p>

            <p
              style={{
                fontSize: "14px",
                color: "#555",
                lineHeight: "1.5",
              }}
            >
              After making the payment, please keep your
              payment receipt/screenshot for confirmation.
            </p>
          </div>
        )}

        <button
          onClick={() => generateInvoice(completedOrder)}
          style={{
            padding: "12px 25px",
            marginRight: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📄 Download Invoice
        </button>

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
        boxSizing: "border-box",
      }}
    >
      {/* Website Name */}
      <h1
        style={{
          textAlign: "center",
          color: "#9a6248",
          marginBottom: "5px",
        }}
      >
        Stitch & Style
      </h1>

      <h2
        style={{
          textAlign: "center",
          marginTop: "10px",
        }}
      >
        Checkout 🛍️
      </h2>

      {/* Ordered Products */}
      <div
        style={{
          margin: "25px 0",
          padding: "15px",
          border: "1px solid #e5d5c9",
          borderRadius: "12px",
          background: "#fffaf6",
        }}
      >
        {cart.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              padding: "10px 0",
              flexWrap: "wrap",
            }}
          >
            <img
              src={item.image_url || ""}
              alt={item.name}
              style={{
                width: "110px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
                background: "#f1f1f1",
              }}
            />

            <div style={{ flex: "1", minWidth: "150px" }}>
              <h3 style={{ margin: "0 0 10px" }}>
                {item.name}
              </h3>

              <p>
                Quantity: {item.quantity}
              </p>

              <p>
                Price: Rs. {Number(item.price)}
              </p>

              {item.selectedColor && (
                <p>Color: {item.selectedColor}</p>
              )}

              {item.selectedSize && (
                <p>Size: {item.selectedSize}</p>
              )}

              {item.selectedFabric && (
                <p>Fabric: {item.selectedFabric}</p>
              )}

              <strong>
                Item Total: Rs.{" "}
                {Number(item.price) * Number(item.quantity || 0)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Product Total */}
      <h3>
        Product Total: Rs. {productTotal}
      </h3>

      {/* Subtotal */}
      <h3>
        Subtotal: Rs. {subtotal}
      </h3>

      {/* Final Total */}
      <h2>
        Final Total: Rs. {total}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Email Updates */}
<div
  style={{
    margin: "20px 0",
    padding: "18px",
    border: "1px solid #e5d5c9",
    borderRadius: "10px",
    background: "#fffaf6",
  }}
>
  <label
    htmlFor="newsletterEmail"
    style={{
      display: "block",
      fontWeight: "bold",
      marginBottom: "8px",
    }}
  >
    Email Address
  </label>

  <input
    id="newsletterEmail"
    type="email"
    value={newsletterEmail}
    onChange={(e) => setNewsletterEmail(e.target.value)}
    placeholder="Enter your email address"
    style={{
      width: "100%",
      padding: "12px",
      boxSizing: "border-box",
      marginBottom: "12px",
    }}
  />

  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      checked={subscribeToNews}
      onChange={(e) => setSubscribeToNews(e.target.checked)}
    />

    <span>Email me with new news</span>
  </label>

  <p
    style={{
      fontSize: "13px",
      color: "#666",
      marginBottom: 0,
    }}
  >
    Tick this option to subscribe to new product
    announcements and Stitch & Style updates.
  </p>
</div>
<div>
  <label>Country / Region</label>
  <input
    type="text"
    name="country"
    value="Pakistan"
    readOnly
    style={{
      width: "100%",
      padding: "12px",
      marginTop: "6px",
      marginBottom: "15px",
      boxSizing: "border-box",
    }}
  />
</div>
        {/* Full Name */}
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
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Phone */}
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
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Address */}
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
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* City */}
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
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      name="saveInformation"
    />
    Save this information for next time
  </label>
</div>

        {/* Payment Method */}
        <div style={{ marginBottom: "20px" }}>
          <label>Payment Method</label>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
              boxSizing: "border-box",
            }}
          >
            <option value="Cash on Delivery">
              Cash on Delivery
            </option>

            <option value="EasyPaisa">
              EasyPaisa
            </option>
          </select>
        </div>

        {/* EasyPaisa QR */}
        {paymentMethod === "EasyPaisa" && (
          <div
            style={{
              marginBottom: "25px",
              padding: "20px",
              textAlign: "center",
              background: "#f8f8f8",
              border: "1px solid #ddd",
              borderRadius: "15px",
            }}
          >
            <h3>EasyPaisa Payment 📱</h3>

            <p>
              Scan the QR code below to pay:
            </p>

            <img
              src="/easypaisa-qr.png"
              alt="EasyPaisa QR Code"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
                display: "block",
                margin: "15px auto",
              }}
            />

            <h3>
              Amount: Rs. {total}
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#555",
                lineHeight: "1.5",
              }}
            >
              Please scan the QR code using your
              EasyPaisa app and pay the exact amount
              shown above.
            </p>

            <p
              style={{
                fontSize: "13px",
                color: "#777",
              }}
            >
              After payment, click "Place Order".
            </p>
          </div>
        )}

        {/* Place Order */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Place Order
        </button>
      </form>
    </div>
  );
}

export default Checkout;