import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [reviews, setReviews] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/admin-login";
      return;
    }

    setUser(user);
    setLoading(false);

    fetchProducts();
    fetchOrders();
    fetchReviews();
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setMessage("❌ Products load nahi huay.");
      return;
    }

    setProducts(data || []);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders error:", error);
      setMessage("❌ Orders load nahi huay.");
      return;
    }

    setOrders(data || []);

    // Fetch all order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .order("id", { ascending: true });

    if (itemsError) {
      console.error("Order items error:", itemsError);
      setMessage("❌ Order products load nahi huay.");
      return;
    }

    // Group items by order_id
    const groupedItems = {};

    (items || []).forEach((item) => {
      if (!groupedItems[item.order_id]) {
        groupedItems[item.order_id] = [];
      }

      groupedItems[item.order_id].push(item);
    });

    setOrderItems(groupedItems);
  }
  async function fetchReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Reviews error:", error);
    setMessage("❌ Reviews load nahi huay.");
    return;
  }

  setReviews(data || []);
}
async function deleteReview(id) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this review?"
  );

  if (!confirmDelete) {
    return;
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete review error:", error);
    alert(`❌ ${error.message}`);
    return;
  }

  alert("✅ Review deleted successfully!");

  fetchReviews();
}

  async function uploadImage() {
    if (!imageFile) {
      return null;
    }

    const fileExtension = imageFile.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, imageFile);

    if (error) {
      console.error("Image upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function addProduct(e) {
    e.preventDefault();
    setMessage("");

    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImage();

      if (!imageUrl) {
        setMessage("❌ Image upload nahi hui.");
        return;
      }
    }

    const { error } = await supabase.from("products").insert([
      {
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("❌ Product add nahi hua.");
      return;
    }

    setMessage("✅ Product successfully add ho gaya!");

    clearForm();
    fetchProducts();
  }

  async function deleteProduct(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage("❌ Product delete nahi hua.");
      return;
    }

    setMessage("✅ Product deleted successfully!");

    fetchProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price);
    setCategory(product.category);
    setStock(product.stock);
    setImageFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateProduct(e) {
    e.preventDefault();
    setMessage("");

    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImage();

      if (!imageUrl) {
        setMessage("❌ New image upload nahi hui.");
        return;
      }
    }

    const updateData = {
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
    };

    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", editingId);

    if (error) {
      console.error(error);
      setMessage("❌ Product update nahi hua.");
      return;
    }

    setMessage("✅ Product updated successfully!");

    clearForm();
    fetchProducts();
  }

  async function updateOrderStatus(id, newStatus) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
      })
      .eq("id", id);

    if (error) {
      console.error("Order status error:", error);
      setMessage("❌ Order status update nahi hua.");
      return;
    }

    setMessage("✅ Order status updated!");

    fetchOrders();
  }

  async function deleteOrder(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmDelete) {
      return;
    }

    // Delete order items first
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);

    if (itemsError) {
      console.error("Order items delete error:", itemsError);
      setMessage("❌ Order products delete nahi huay.");
      return;
    }

    // Delete the order
    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (orderError) {
      console.error("Order delete error:", orderError);
      setMessage("❌ Order delete nahi hua.");
      return;
    }

    setMessage("✅ Order deleted successfully!");

    fetchOrders();
  }

  function clearForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Clothing");
    setStock("");
    setImageFile(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin-login";
  }

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
        }}
      >
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "auto",
        padding: "40px 20px",
      }}
    >
      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Stitch & Style Admin Dashboard</h1>

          <p>
            Logged in as: <strong>{user?.email}</strong>
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            background: "#222",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Add / Edit Product */}

      <h2 style={{ marginTop: "30px" }}>
        {editingId ? "Edit Product" : "Add New Product"}
      </h2>

      <form
        onSubmit={editingId ? updateProduct : addProduct}
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          marginTop: "20px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label>Product Name</label>
          <br />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter product name"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description</label>
          <br />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            style={{
              width: "100%",
              padding: "10px",
              minHeight: "80px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Price</label>
          <br />

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            required
            min="0"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Category</label>
          <br />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          >
            <option value="Clothing">Clothing</option>
            <option value="Crochet">Crochet</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Stock</label>
          <br />

          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Enter stock quantity"
            required
            min="0"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Product Image</label>
          <br />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={{
              marginTop: "8px",
            }}
          />
        </div>

        <button type="submit">
          {editingId ? "Update Product" : "Add Product"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={clearForm}
            style={{
              marginLeft: "10px",
              background: "#777",
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Message */}

      {message && (
        <p
          style={{
            marginTop: "20px",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      {/* Orders */}

      <h2 style={{ marginTop: "50px" }}>Customer Orders 📦</h2>

      {orders.length === 0 ? (
        <p>No orders available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3>Order #{order.id}</h3>

              <p>
                <strong>Customer:</strong> {order.customer_name}
              </p>

              <p>
                <strong>Phone:</strong> {order.phone}
              </p>

              <p>
                <strong>Address:</strong> {order.address}
              </p>

              <p>
                <strong>City:</strong> {order.city}
              </p>

              <p>
                <strong>Total:</strong> Rs. {order.total}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>

              {/* Ordered Products */}

              <div style={{ marginTop: "20px" }}>
                <h4>Ordered Products 🛍️</h4>

                {orderItems[order.id]?.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "15px",
                      marginTop: "10px",
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
                          <h4 style={{ margin: "0 0 8px 0" }}>
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
                            {Number(item.price) * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No product details available for this order.</p>
                )}
              </div>

              {/* Order Status */}

              <div style={{ marginTop: "20px" }}>
                <label>
                  <strong>Status:</strong>
                </label>

                <select
                  value={order.status}
                  onChange={(e) =>
                    updateOrderStatus(order.id, e.target.value)
                  }
                  style={{
                    marginLeft: "10px",
                    padding: "8px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={() => deleteOrder(order.id)}
                  style={{
                    marginLeft: "10px",
                    padding: "8px 12px",
                    background: "#b33",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Delete Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
  style={{
    marginTop: "50px",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
  <h2>Customer Reviews ⭐</h2>

  {reviews.length === 0 ? (
    <p>No customer reviews yet.</p>
  ) : (
    reviews.map((review) => (
      <div
        key={review.id}
        style={{
          padding: "15px",
          marginTop: "15px",
          border: "1px solid #eee",
          borderRadius: "10px",
          background: "#fafafa",
        }}
      >
        <h3>{review.customer_name}</h3>

        <p>
          {"⭐".repeat(Number(review.rating))}
        </p>

        <p>{review.comment}</p>

        <p
          style={{
            fontSize: "13px",
            color: "#888",
          }}
        >
          {new Date(review.created_at).toLocaleDateString()}
        </p>

        <button
          onClick={() => deleteReview(review.id)}
          style={{
            padding: "8px 15px",
            background: "#b33",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🗑️ Delete Review
        </button>
      </div>
    ))
  )}
</div>

      {/* Products */}

      <h2 style={{ marginTop: "50px" }}>All Products</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "15px",
                  }}
                />
              )}

              <h3>{product.name}</h3>

              <p>{product.description}</p>

              <p>
                <strong>Price:</strong> Rs. {product.price}
              </p>

              <p>
                <strong>Category:</strong> {product.category}
              </p>

              <p>
                <strong>Stock:</strong> {product.stock}
              </p>

              <button onClick={() => startEdit(product)}>
                Edit
              </button>

              <button
                onClick={() => deleteProduct(product.id)}
                style={{
                  marginLeft: "10px",
                  background: "#b33",
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Admin;