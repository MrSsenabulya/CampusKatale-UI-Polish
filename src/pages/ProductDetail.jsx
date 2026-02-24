// pages/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar, Footer, AdCard } from "../components";
import "@fontsource-variable/lexend";
import { getImageUrl } from "../utils/imageUtils";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const locations = [
    "Nakiyingi Hostel Gate",
    "Kikoni",
    "Opp. Douglas Villa Hostel",
    "Olympia Hostel",
    "Main Campus",
    "Nkurumah Hall",
    "Lumumba Hall",
  ];

  const STRAPI_URL = "http://localhost:1337";

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${STRAPI_URL}/api/products/${id}?populate=*`,
        );

        if (!response.ok) throw new Error("Product not found");

        const data = await response.json();
        const item = data.data;

        if (!item) throw new Error("Product not found");

        const formattedProduct = {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          image: item.image?.data ? `${STRAPI_URL}${item.image.data.url}` : "",
          categorySlug: item.category?.data?.slug || "",
          categoryName: item.category?.data?.name || "",
        };

        setProduct(formattedProduct);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product?.categorySlug) return;

      setLoadingRelated(true);

      try {
        const response = await fetch(
          `${STRAPI_URL}/api/products?filters[category][slug][$eq]=${product.categorySlug}&filters[id][$ne]=${id}&populate=*`,
        );

        if (!response.ok) throw new Error("Failed to fetch related");

        const data = await response.json();

        const formatted = data.data.map((item) => ({
          id: item.id,
          title: item.attributes.title,
          description: item.attributes.description,
          price: item.attributes.price,
          image: item.attributes.image?.data
            ? `${STRAPI_URL}${item.attributes.image.data.attributes.url}`
            : "",
        }));

        setRelatedProducts(formatted.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchRelatedProducts();
  }, [product, id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9FAFB] font-[Lexend]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#177529] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#177529] font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9FAFB] font-[Lexend]">
        <div className="text-center text-[#177529]">
          <p className="text-lg font-semibold mb-2">⚠️ Error</p>
          <p>{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-[#177529] text-white rounded-lg hover:bg-[#135c21]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );

  if (!product) return null;

  const productImages = product.images || [product.thumbnail || ""];
  const productLocation = locations[parseInt(id) % locations.length];
  const productPrice = `UGX. ${(product.price * 3700).toLocaleString()}/=`;
  const hasDiscount = parseInt(id) % 3 === 0; // Show discount on every 3rd product

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="font-[Lexend] bg-white flex-grow pt-28 px-6 md:px-10 pb-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="mb-6 px-4 py-2 text-[#177529] hover:underline"
          >
            ← Back to listings
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Main Product Image */}
            <div className="space-y-4">
              {/* Large Main Image */}
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden border-2 border-[#177529]">
                <img
                  src={getImageUrl(
                    productImages[selectedImage] || productImages[0],
                  )}
                  alt={product.title}
                  className="w-full h-[350px] object-cover"
                />
                {/* Discount Badge - Top Right */}
                {hasDiscount && (
                  <div className="absolute top-3 right-3 bg-[#177529] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                    20% OFF
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-4">
                {productImages.slice(0, 2).map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative bg-gray-100 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImage === index
                        ? "border-[#177529]"
                        : "border-[#177529]"
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {hasDiscount && (
                      <div className="absolute top-2 right-2 bg-[#177529] text-white text-xs font-semibold px-2 py-1 rounded-lg">
                        20% OFF
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Product Information */}
            <div className="flex flex-col justify-start space-y-6">
              {/* Price */}
              <div>
                <p className="text-[#177529] font-bold text-3xl mb-1">
                  {productPrice}
                </p>
                <p className="text-gray-500 text-sm">Per Serving</p>
              </div>

              {/* Product Name */}
              <h1 className="text-[#0C0D19] font-bold text-2xl">
                {product.title}
              </h1>

              {/* Location */}
              <p className="text-gray-500 text-base">{productLocation}</p>

              {/* Product Description */}
              {product.description && (
                <p className="text-[#0C0D19] text-base leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-[#177529] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#135c21] transition-colors">
                  Show Contact
                </button>
                <button className="bg-white text-[#177529] font-medium px-6 py-3 rounded-lg border-2 border-[#177529] hover:bg-[#f0f9f4] transition-colors">
                  Start Chat
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-gray-500 text-sm pt-4 border-t border-gray-200">
                Disclaimer: Do not PAY in advance. Meet with the seller first.
              </p>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-[#0C0D19] mb-6">
                More from {product.category}
              </h2>
              {loadingRelated ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-t-transparent border-[#177529] rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <AdCard
                      key={relatedProduct.id}
                      id={relatedProduct.id}
                      image={
                        relatedProduct.images?.[0] || relatedProduct.thumbnail
                      }
                      title={relatedProduct.title}
                      description={relatedProduct.description}
                      badge={`$${relatedProduct.price}`}
                      buttonText="View Details"
                      onButtonClick={() =>
                        navigate(`/product/${relatedProduct.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ProductDetail;
