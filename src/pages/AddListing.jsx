import { useState } from "react";
import { Navbar } from "../components";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";

const STRAPI_URL = "https://campuskatale-fwih.onrender.com";

const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");

function AddListing() {
  const navigate = useNavigate();
  const goHome = () => {
    navigate("/");
  };
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    images: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert("You can upload a maximum of 3 images.");
      return;
    }
    setFormData({ ...formData, images: files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let uploadedImageId = null;

      if (formData.images.length > 0) {
        const imageData = new FormData();
        imageData.append("files", formData.images[0]);

        const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: "POST",
          body: imageData,
        });

        const uploadResult = await uploadRes.json();
        uploadedImageId = uploadResult[0]?.id;
      }

      // 2️⃣ Create Product
      const productPayload = {
        data: {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          slug: generateSlug(formData.title),
          image: uploadedImageId,
          category: formData.category, // must be category ID
        },
      };

      const productRes = await fetch(`${STRAPI_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productPayload),
      });

      if (!productRes.ok) throw new Error("Failed to create listing");

      alert("Listing created successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0C0D19] font-[Lexend] p-6">
      <Navbar />
      <div className="max-w-3xl mx-auto bg-[#F8F8F8] p-8 rounded-2xl shadow-lg mt-20">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#177529] mb-6">
          Add New Listing
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[#0C0D19] font-semibold mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border border-[#97C040] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#177529]"
              placeholder="Enter listing title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#0C0D19] font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full p-3 border border-[#97C040] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#177529]"
              placeholder="Describe your listing"
              required
            ></textarea>
          </div>

          {/* Price */}
          <div>
            <label className="block text-[#0C0D19] font-semibold mb-2">
              Price
            </label>
            <div className="flex items-center border border-[#97C040] rounded-lg focus-within:ring-2 focus-within:ring-[#177529]">
              <span className="px-4 text-[#177529] font-semibold bg-[#F8F8F8] rounded-l-lg">
                UGX
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-3 rounded-r-lg focus:outline-none bg-white"
                placeholder="Enter price"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[#0C0D19] font-semibold mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 border border-[#97C040] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#177529]"
              required
            >
              <option value="">Select category</option>
              <option value="1">Groceries</option>
              <option value="3">Skincare</option>
              <option value="5">Smartphones</option>
              <option value="7">Furniture</option>
              <option value="9">Laptops</option>
              <option value="11">Home & Kitchen</option>
              <option value="13">Jewellery</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[#0C0D19] font-semibold mb-2">
              Upload Images (max 3)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                        file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                        file:bg-[#177529] file:text-white hover:file:bg-[#97C040]
                        cursor-pointer"
            />
            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-28 h-28 rounded-lg overflow-hidden border border-[#97C040]"
                  >
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#177529] text-white py-3 rounded-xl font-semibold hover:bg-[#97C040] transition-colors duration-300"
          >
            Submit Listing
          </button>
        </form>
        <div className="flex justify-center mt-6 mb-4">
          <button
            onClick={goHome}
            className="px-6 py-3 rounded-xl font-semibold text-[#177529] border border-[#177529] hover:bg-[#177529] hover:text-white transition-all shadow-md"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddListing;
