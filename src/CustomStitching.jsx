import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function CustomStitching() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loading, setLoading] = useState(false);

  const [referenceImage, setReferenceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    product_name: "",
    size: "",
    measurements: "",
    stitching_instructions: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
  console.error("Products error:", error);

  alert(
    "Products load nahi ho rahe.\n\n" +
    error.message +
    "\n\nCode: " +
    error.code
  );

  setLoadingProducts(false);
  return;
}

    setProducts(data || []);
    setLoadingProducts(false);
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) {
      setReferenceImage(null);
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      return;
    }

    setReferenceImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!formData.product_name) {
      alert("Please select a product.");
      return;
    }

    if (!formData.size) {
      alert("Please select a size.");
      return;
    }

    if (!formData.measurements.trim()) {
      alert("Please enter your measurements.");
      return;
    }

    setLoading(true);

    let referenceImageUrl = "";

    // Upload reference image
    if (referenceImage) {
      const fileExtension =
        referenceImage.name.split(".").pop();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const filePath = `requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("custom-stitching")
        .upload(filePath, referenceImage);

      if (uploadError) {
        console.error("Image upload error:", uploadError);

        alert(
          "❌ Image upload failed.\n\n" +
            uploadError.message
        );

        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("custom-stitching")
        .getPublicUrl(filePath);

      referenceImageUrl =
        publicUrlData?.publicUrl || "";
    }

    // Save request
    const { error } = await supabase
      .from("custom_stitching_requests")
      .insert([
        {
          customer_name: formData.customer_name,
          phone: formData.phone,
          product_name: formData.product_name,
          size: formData.size,
          measurements: formData.measurements,
          stitching_instructions:
            formData.stitching_instructions,
          reference_image_url: referenceImageUrl,
        },
      ]);

    setLoading(false);

    if (error) {
      console.error("Custom stitching error:", error);

      alert(
        "❌ Error: " +
          error.message +
          "\n\nCode: " +
          error.code
      );

      return;
    }

    alert(
      "✅ Custom stitching request successfully submitted!"
    );

    setFormData({
      customer_name: "",
      phone: "",
      product_name: "",
      size: "",
      measurements: "",
      stitching_instructions: "",
    });

    setReferenceImage(null);
    setImagePreview("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7f5",
        padding: "30px 20px",
        color: "#222",
      }}
    >
      <div
        style={{
          maxWidth: "750px",
          margin: "0 auto 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#8b5e3c",
          }}
        >
          🧵 Stitch & Style
        </h1>

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "bold",
          }}
        >
          ← Back to Home
        </a>
      </div>

      <div
        style={{
          maxWidth: "750px",
          margin: "auto",
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Custom Stitching Request
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Apni stitching requirements submit karein.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Customer Name
          </label>

          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            placeholder="Enter your name"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="03XXXXXXXXX"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Choose Product
          </label>

          <select
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">
              {loadingProducts
                ? "Loading products..."
                : "Select Product"}
            </option>

            {!loadingProducts &&
              products.map((product) => (
                <option
                  key={product.id}
                  value={product.name}
                >
                  {product.name}
                </option>
              ))}
          </select>

          <label style={labelStyle}>
            Select Size
          </label>

          <select
            name="size"
            value={formData.size}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>

          <label style={labelStyle}>
            Measurements
          </label>

          <textarea
            name="measurements"
            value={formData.measurements}
            onChange={handleChange}
            placeholder="Example: Chest 36, Waist 30, Length 40..."
            rows="6"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Stitching Instructions
          </label>

          <textarea
            name="stitching_instructions"
            value={formData.stitching_instructions}
            onChange={handleChange}
            placeholder="Enter any special stitching instructions..."
            rows="6"
            style={inputStyle}
          />

          <label style={labelStyle}>
            📷 Reference Design
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: "100%",
              marginBottom: "15px",
            }}
          />

          {imagePreview && (
            <div
              style={{
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                Image Preview
              </p>

              <img
                src={imagePreview}
                alt="Reference preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "10px",
              background: loading ? "#aaa" : "#8b5e3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Uploading & Submitting..."
              : "🧵 Submit Stitching Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

export default CustomStitching;