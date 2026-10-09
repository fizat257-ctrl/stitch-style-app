import { useState } from "react";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";

function Checkout() {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [completedTotals, setCompletedTotals] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buyNowItem = JSON.parse(
    localStorage.getItem("buyNowItem") || "null"
  );

  const cart = buyNowItem
    ? [buyNowItem]
    : JSON.parse(localStorage.getItem("cart") || "[]");

  const productTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity || 0),
    0
  );

  const deliveryCharges = 500;
  const subtotal = productTotal;
  const total = subtotal + deliveryCharges;

  function handleChange(e) {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  }

  function hasCustomMeasurements(item) {
    return (
      item.customMeasurements &&
      Object.values(item.customMeasurements).some(
        (value) => String(value ?? "").trim() !== ""
      )
    );
  }

  function formatMeasurementName(name) {
    const labels = {
      chest: "Chest",
      waist: "Waist",
      hips: "Hips",
      shoulder: "Shoulder",
      length: "Length",
      sleeve: "Sleeve",
    };

    return labels[name] || name;
  }

  function generateInvoice(order) {
    if (!order) return;

    const doc = new jsPDF();

    const savedTotals = completedTotals || {
      productTotal: 0,
      subtotal: 0,
      deliveryCharges: 500,
      total: Number(order.total || 0),
    };

    let y = 20;

    function addText(text, size = 10) {
      doc.setFontSize(size);

      const lines = doc.splitTextToSize(String(text), 170);

      if (y + lines.length * 7 > 275) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, 20, y);
      y += lines.length * 7;
    }

    addText("Stitch & Style", 20);
    addText("Order Invoice / Receipt", 14);
    addText(`Order ID: ${order.id}`);
    addText(`Customer: ${customer.name}`);
    addText(`Phone: ${customer.phone}`);
    addText(`Address: ${customer.address}`);
    addText(`City: ${customer.city}`);
    addText(`Payment: ${paymentMethod}`);

    y += 3;
    addText("ORDERED PRODUCTS", 13);

    completedItems.forEach((item, index) => {
      addText(`${index + 1}. ${item.name}`);
      addText(`Quantity: ${item.quantity}`);
      addText(`Price: Rs. ${Number(item.price)}`);

      if (item.selectedColor) {
        addText(`Color: ${item.selectedColor}`);
      }

      if (item.selectedSize) {
        addText(`Size: ${item.selectedSize}`);
      }

      if (item.selectedFabric) {
        addText(`Fabric: ${item.selectedFabric}`);
      }

      if (hasCustomMeasurements(item)) {
        addText("Custom Measurements:");

        Object.entries(item.customMeasurements).forEach(
          ([name, value]) => {
            if (String(value ?? "").trim() !== "") {
              addText(
                `${formatMeasurementName(name)}: ${value} inches`
              );
            }
          }
        );
      }

      y += 3;
    });

    y += 3;
    addText(`Product Total: Rs. ${savedTotals.productTotal}`);
    addText(`Subtotal: Rs. ${savedTotals.subtotal}`);
    addText(`Delivery: Rs. ${savedTotals.deliveryCharges}`);
    addText(`Final Total: Rs. ${savedTotals.total}`, 13);
    addText("Thank you for shopping with Stitch & Style!");

    doc.save(`Stitch-Style-Order-${order.id}.pdf`);
  }
  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const stockError = cart.some(
      (item) =>
        Number(item.quantity) < 1 ||
        Number(item.quantity) > Number(item.stock)
    );

    if (stockError) {
      alert("Please check product stock and quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customer.name.trim(),
            phone: customer.phone.trim(),
            address: customer.address.trim(),
            city: customer.city.trim(),
            total,
            status: "pending",
            payment_method: paymentMethod,
          },
        ])
        .select()
        .single();

      if (orderError) {
        alert(orderError.message);
        return;
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image_url: item.image_url || "",
        selected_color: item.selectedColor || "",
        selected_size: item.selectedSize || "",
        selected_fabric: item.selectedFabric || "",
        custom_measurements: hasCustomMeasurements(item)
          ? item.customMeasurements
          : null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        alert(
          "Order created, but products could not be saved: " +
            itemsError.message
        );
        return;
      }

      for (const item of cart) {
        const { error } = await supabase.rpc(
          "reduce_product_stock",
          {
            p_product_id: item.id,
            p_quantity: Number(item.quantity),
          }
        );

        if (error) {
          alert("Stock update failed: " + error.message);
          return;
        }
      }

      setCompletedItems(
        cart.map((item) => ({
          ...item,
          customMeasurements: item.customMeasurements
            ? { ...item.customMeasurements }
            : {},
        }))
      );

      setCompletedTotals({
        productTotal,
        subtotal,
        deliveryCharges,
        total,
      });

      localStorage.setItem("customerPhone", customer.phone);

      setCompletedOrder(order);
      setOrderPlaced(true);

      localStorage.removeItem("cart");
      localStorage.removeItem("buyNowItem");
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div style={{ textAlign: "center", margin: "80px auto" }}>
        <h1>Your Cart is Empty 🛒</h1>
        <a href="/">
          <button>Continue Shopping</button>
        </a>
      </div>
    );
  }

  if (orderPlaced) {
    const savedTotals = completedTotals || {
      productTotal: 0,
      subtotal: 0,
      deliveryCharges: 500,
      total: Number(completedOrder?.total || 0),
    };

    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "50px auto",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#9a6248" }}>
          Stitch & Style
        </h1>

        <h2 style={{ textAlign: "center" }}>
          🎉 Order Received!
        </h2>

        <p>Thank you, {customer.name}.</p>
        <p>We will contact you on {customer.phone}.</p>

        <p>Product Total: Rs. {savedTotals.productTotal}</p>
        <p>Subtotal: Rs. {savedTotals.subtotal}</p>
        <p>Delivery Charges: Rs. {savedTotals.deliveryCharges}</p>
        <h3>Final Total: Rs. {savedTotals.total}</h3>
        <p>Payment Method: {paymentMethod}</p>

        {completedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <strong>{item.name}</strong>
            <p>Quantity: {item.quantity}</p>

            {item.selectedColor && (
              <p>Color: {item.selectedColor}</p>
            )}

            {item.selectedSize && (
              <p>Size: {item.selectedSize}</p>
            )}

            {item.selectedFabric && (
              <p>Fabric: {item.selectedFabric}</p>
            )}

            {hasCustomMeasurements(item) && (
              <div>
                <strong>Custom Measurements:</strong>

                {Object.entries(item.customMeasurements).map(
                  ([name, value]) =>
                    String(value ?? "").trim() !== "" && (
                      <p key={name}>
                        {formatMeasurementName(name)}: {value} inches
                      </p>
                    )
                )}
              </div>
            )}
          </div>
        ))}

        {paymentMethod === "EasyPaisa" && (
          <div style={{ textAlign: "center", margin: "25px auto" }}>
            <h3>EasyPaisa Payment</h3>
            <p>Scan the QR code to complete your payment.</p>

            <img
              src="/easypaisa-qr.png"
              alt="EasyPaisa QR Code"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
              }}
            />

            <p>Amount: Rs. {savedTotals.total}</p>
            <p>Keep your payment receipt for confirmation.</p>
          </div>
        )}

        <button
          onClick={() => generateInvoice(completedOrder)}
          style={{ padding: "12px 20px", marginRight: "10px" }}
        >
          📄 Download Invoice
        </button>

        <a href="/">
          <button style={{ padding: "12px 20px" }}>
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
      <h1 style={{ textAlign: "center", color: "#9a6248" }}>
        Stitch & Style
      </h1>

      <h2 style={{ textAlign: "center" }}>Checkout 🛍️</h2>

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
            key={`${item.id}-${index}`}
            style={{
              display: "flex",
              gap: "15px",
              padding: "12px 0",
              flexWrap: "wrap",
              borderBottom: "1px solid #eee",
            }}
          >
            <img
              src={item.image_url || ""}
              alt={item.name}
              style={{
                width: "100px",
                height: "110px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />

            <div style={{ flex: "1", minWidth: "150px" }}>
              <h3>{item.name}</h3>
              <p>Quantity: {item.quantity}</p>
              <p>Price: Rs. {Number(item.price)}</p>

              {item.selectedColor && (
                <p>Color: {item.selectedColor}</p>
              )}

              {item.selectedSize && (
                <p>Size: {item.selectedSize}</p>
              )}

              {item.selectedFabric && (
                <p>Fabric: {item.selectedFabric}</p>
              )}

              {hasCustomMeasurements(item) && (
                <div>
                  <strong>Custom Measurements:</strong>

                  {Object.entries(item.customMeasurements).map(
                    ([name, value]) =>
                      String(value ?? "").trim() !== "" && (
                        <p key={name}>
                          {formatMeasurementName(name)}: {value} inches
                        </p>
                      )
                  )}
                </div>
              )}

              <strong>
                Item Total: Rs.{" "}
                {Number(item.price) * Number(item.quantity || 0)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      <h3>Product Total: Rs. {productTotal}</h3>
      <h3>Subtotal: Rs. {subtotal}</h3>
      <h3>Delivery Charges: Rs. {deliveryCharges}</h3>
      <h2>Final Total: Rs. {total}</h2>

      <form onSubmit={handleSubmit}>
        {/* Email Updates */}
        <div style={{ margin: "20px 0" }}>
          <label htmlFor="newsletterEmail">Email Address</label>

          <input
            id="newsletterEmail"
            type="email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="Enter your email address"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={subscribeToNews}
              onChange={(e) =>
                setSubscribeToNews(e.target.checked)
              }
            />
            Email me with new news
          </label>
        </div>

        {/* Country */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="country">Country / Region</label>
          <input
            id="country"
            value="Pakistan"
            readOnly
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="customerName">Full Name</label>
          <input
            id="customerName"
            name="name"
            value={customer.name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="customerPhone">Phone Number</label>
          <input
            id="customerPhone"
            type="tel"
            name="phone"
            value={customer.phone}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="customerAddress">Complete Address</label>
          <textarea
            id="customerAddress"
            name="address"
            value={customer.address}
            onChange={handleChange}
            required
            rows="4"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="customerCity">City</label>
          <input
            id="customerCity"
            name="city"
            value={customer.city}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Shipping */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Shipping Method</h3>
          <p>Standard Delivery — All over Pakistan</p>
          <p>Delivery Charges: Rs. {deliveryCharges}</p>
        </div>

        {/* Payment */}
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="paymentMethod">Payment Method</label>

          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              boxSizing: "border-box",
            }}
          >
            <option value="Cash on Delivery">
              Cash on Delivery
            </option>
            <option value="EasyPaisa">EasyPaisa</option>
          </select>
        </div>

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
            <p>Scan the QR code below to pay:</p>

            <img
              src="/easypaisa-qr.png"
              alt="EasyPaisa QR Code"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
              }}
            />

            <h3>Amount: Rs. {total}</h3>
            <p>After payment, click Place Order.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            border: "none",
            borderRadius: "8px",
          }}
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

export default Checkout;