import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function Admin() {
  const [stitchingRequests, setStitchingRequests] = useState([]);
const [loadingStitching, setLoadingStitching] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
const [totalCustomers, setTotalCustomers] = useState(0);
const [pendingOrders, setPendingOrders] = useState(0);
  const [orderItems, setOrderItems] = useState({});
  const [reviews, setReviews] = useState([]);
  const [productImages, setProductImages] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [stock, setStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);
  async function fetchStitchingRequests() {
  const { data, error } = await supabase
    .from("custom_stitching_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Stitching requests error:", error);
    return;
  }

  setStitchingRequests(data || []);
  setLoadingStitching(false);
}

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

    fetchStitchingRequests();
    fetchProducts();
    fetchOrders();
    fetchReviews();
    fetchProductImages();
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
    const orderData = data || [];

setTotalRevenue(
  orderData.reduce(
    (total, order) => total + Number(order.total_amount || 0),
    0
  )
);

setPendingOrders(
  orderData.filter(
    (order) => order.status === "Pending"
  ).length
);

const uniqueCustomers = new Set(
  orderData.map((order) => order.phone)
);

setTotalCustomers(uniqueCustomers.size);

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
async function updateStitchingStatus(id, status) {
  const { data, error } = await supabase
    .from("custom_stitching_requests")
    .update({ status: status })
    .eq("id", id)
    .select();

  if (error) {
    console.error(
      "Stitching status error:",
      error
    );

    alert(
      "Status update failed: " +
        error.message
    );

    return;
  }

  console.log(
    "Updated stitching request:",
    data
  );

  if (!data || data.length === 0) {
    alert(
      "Status update nahi hua. Database row update nahi hui."
    );
    return;
  }

  setStitchingRequests((prev) =>
    prev.map((request) =>
      request.id === id
        ? {
            ...request,
            status: data[0].status,
          }
        : request
    )
  );

  alert(
    `✅ Status changed to ${data[0].status}`
  );
}
async function fetchProductImages() {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Product images error:", error);
    return;
  }

  setProductImages(data || []);
}
async function uploadProductGalleryImage(productId, file) {
  if (!file) return;

  const fileName = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Gallery image upload error:", uploadError);
    alert(`❌ ${uploadError.message}`);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(fileName);

  const { error: insertError } = await supabase
    .from("product_images")
    .insert([
      {
        product_id: productId,
        image_url: publicUrlData.publicUrl,
      },
    ]);

  if (insertError) {
    console.error("Gallery image save error:", insertError);
    alert(`❌ ${insertError.message}`);
    return;
  }

  alert("✅ Product image added successfully!");

  fetchProductImages();
}
async function deleteProductGalleryImage(id, imageUrl) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this image?"
  );

  if (!confirmDelete) {
    return;
  }

  const fileName = imageUrl.split("/").pop();

  const { error: storageError } = await supabase.storage
    .from("products")
    .remove([fileName]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Database delete error:", error);
    alert(`❌ ${error.message}`);
    return;
  }

  alert("✅ Image deleted successfully!");

  fetchProductImages();
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
  async function uploadVideo() {
  if (!videoFile) {
    return null;
  }

  const fileExtension = videoFile.name.split(".").pop();

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExtension}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(fileName, videoFile);

  if (error) {
    console.error("Video upload error:", error);
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

    let videoUrl = null;

    if (videoFile) {
      videoUrl = await uploadVideo();

      if (!videoUrl) {
        setMessage("❌ Video upload nahi hui.");
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
     discount: Number(discount),
    image_url: imageUrl,
    video_url: videoUrl,
   
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
    setDiscount(product.discount || 0);
    setFeatured(product.featured || false);
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
      featured: featured,
      discount: Number(discount),
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
    setFeatured(false);
    setDiscount(0);
    setImageFile(null);
    setVideoFile(null);
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
            <option value="Fragrance">Fragrance</option>
<option value="Jewelry">Jewelry</option>
<option value="Makeup">Makeup</option>
<option value="Bags">Bags</option>
          </select>
        </div>
        <div style={{ marginBottom: "15px" }}>
  <label>
    <input
      type="checkbox"
      checked={featured}
      onChange={(e) => setFeatured(e.target.checked)}
      style={{ marginRight: "8px" }}
    />
    ⭐ Featured Product
  </label>
</div>
<div style={{ marginBottom: "15px" }}>
  <label>Discount (%)</label>
  <br />

  <input
    type="number"
    min="0"
    max="100"
    value={discount}
    onChange={(e) => setDiscount(e.target.value)}
    placeholder="Enter discount percentage"
    style={{
      width: "100%",
      padding: "10px",
      marginTop: "5px",
    }}
  />
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

  <div style={{ marginTop: "15px" }}>
    <label>Product Video</label>
    <br />

    <input
      type="file"
      accept="video/*"
      onChange={(e) => setVideoFile(e.target.files[0])}
      style={{
        marginTop: "8px",
      }}
    />
  </div>
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
  <strong>Payment Method:</strong>{" "}
  {order.payment_method}
</p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
              <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  }}
>
  <div
    style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f5f5f5",
      textAlign: "center",
    }}
  >
    <h3>📦 Total Orders</h3>
    <h2>{orders.length}</h2>
  </div>

  <div
    style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f5f5f5",
      textAlign: "center",
    }}
  >
    <h3>💰 Total Revenue</h3>
    <h2>Rs. {totalRevenue}</h2>
  </div>

  <div
    style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f5f5f5",
      textAlign: "center",
    }}
  >
    <h3>🛍️ Total Products</h3>
    <h2>{products.length}</h2>
  </div>

  <div
    style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f5f5f5",
      textAlign: "center",
    }}
  >
    <h3>👥 Customers</h3>
    <h2>{totalCustomers}</h2>
  </div>

  <div
    style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f5f5f5",
      textAlign: "center",
    }}
  >
    <h3>⏳ Pending Orders</h3>
    <h2>{pendingOrders}</h2>
  </div>
</div>
            

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
                          <p style={{ margin: "5px 0" }}>
  Color: {item.selected_color || "N/A"}
</p>

<p style={{ margin: "5px 0" }}>
  Size: {item.selected_size || "N/A"}
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
      {/* Custom Stitching Requests */}

<div
  style={{
    marginTop: "30px",
    padding: "20px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.08)",
  }}
>
  <h2 style={{ color: "#8b5e3c" }}>
    🧵 Custom Stitching Requests
  </h2>

  {loadingStitching ? (
    <p>Loading stitching requests...</p>
  ) : stitchingRequests.length === 0 ? (
    <p>No custom stitching requests found.</p>
  ) : (
    stitchingRequests.map((request) => (
      <div
        key={request.id}
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "15px",
          marginTop: "15px",
        }}
      >
        <p>
          <strong>Customer:</strong>{" "}
          {request.customer_name}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {request.phone}
        </p>

        <p>
          <strong>Product:</strong>{" "}
          {request.product_name || "N/A"}
        </p>

        <p>
          <strong>Size:</strong>{" "}
          {request.size || "N/A"}
        </p>

        <p>
          <strong>Measurements:</strong><br />
          {request.measurements || "N/A"}
        </p>

        <p>
          <strong>Instructions:</strong><br />
          {request.stitching_instructions || "N/A"}
        </p>

        <div style={{ marginTop: "10px" }}>
  <strong>Status:</strong>

  <select
    value={request.status || "Pending"}
    onChange={(e) =>
      updateStitchingStatus(
        request.id,
        e.target.value
      )
    }
    style={{
      marginLeft: "10px",
      padding: "7px",
      borderRadius: "6px",
      border: "1px solid #ccc",
    }}
  >
    <option value="Pending">Pending</option>
    <option value="Confirmed">Confirmed</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
    <option value="Cancelled">Cancelled</option>
  </select>
</div>

        {request.reference_image_url && (
          <div style={{ marginTop: "10px" }}>
            <strong>Reference Design:</strong>
            <br />

            <img
              src={request.reference_image_url}
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
    ))
  )}
</div>
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
              {product.video_url && (
  <video
    src={product.video_url}
    controls
    style={{
      width: "100%",
      height: "200px",
      objectFit: "cover",
      borderRadius: "10px",
      marginBottom: "15px",
    }}
  />
)}
              <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    uploadProductGalleryImage(
      product.id,
      e.target.files[0]
    )
  }
/>
<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "10px",
  }}
>
  {productImages
  .filter((image) => image.product_id === product.id)
  .map((image) => (
    <div key={image.id}>
      <img
        src={image.image_url}
        alt={product.name}
        style={{
          width: "80px",
          height: "80px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />

      <button
        onClick={() =>
          deleteProductGalleryImage(
            image.id,
            image.image_url
          )
        }
        style={{
          display: "block",
          marginTop: "5px",
          padding: "5px 8px",
          background: "#b33",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        🗑️ Delete
      </button>
    </div>
  ))}
</div>

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