import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar, Footer, AdCard } from "../components";
import "@fontsource-variable/lexend";

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

  const STRAPI_URL = "https://campuskatale-fwih.onrender.com";
  // const STRAPI_URL = "http://localhost:1337"; 
  // FETCH SINGLE PRODUCT
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
          image: item.image?.url || "",
          categorySlug: item.category?.slug || "",
          categoryName: item.category?.name || "",
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

  // FETCH RELATED PRODUCTS
  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product?.categorySlug) return;

      setLoadingRelated(true);

      try {
        const url = `${STRAPI_URL}/api/products?filters[category][slug][$eq]=${product.categorySlug}&filters[slug][$ne]=${product.slug}&populate=*`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch related");

        const data = await response.json();

        const formatted = data.data.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          image: item.image?.url || "",
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

  const USD_TO_UGX = 3700;


const convertedPrice = product.price
  ? Math.round(product.price * USD_TO_UGX)
  : 0;

  if (!product) return null;

  const productImages = product.image ? [product.image] : [];
  const productLocation = locations[parseInt(id) % locations.length];
  const productPrice = `UGX ${convertedPrice.toLocaleString()}`;
  const hasDiscount = parseInt(id) % 3 === 0;

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
            {/* LEFT SIDE */}
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden border-2 border-[#177529]">
                <img
                  src={productImages[selectedImage] || ""}
                  alt={product.title}
                  className="w-full h-[350px] object-cover"
                />

                {hasDiscount && (
                  <div className="absolute top-3 right-3 bg-[#177529] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                    20% OFF
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {productImages.slice(0, 2).map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className="relative bg-gray-100 rounded-2xl overflow-hidden border-2 cursor-pointer border-[#177529]"
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex flex-col justify-start space-y-6">
              <div>
                <p className="text-[#177529] font-bold text-3xl mb-1">
                  {productPrice}
                </p>
                <p className="text-gray-500 text-sm">Per Serving</p>
              </div>

              <h1 className="text-[#0C0D19] font-bold text-2xl">
                {product.title}
              </h1>

              <p className="text-gray-500 text-base">{productLocation}</p>

              {product.description && (
                <p className="text-[#0C0D19] text-base leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-[#177529] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#135c21] transition-colors">
                  Show Contact
                </button>

                <button className="bg-white text-[#177529] font-medium px-6 py-3 rounded-lg border-2 border-[#177529] hover:bg-[#f0f9f4] transition-colors">
                  Start Chat
                </button>
              </div>

              <p className="text-gray-500 text-sm pt-4 border-t border-gray-200">
                Disclaimer: Do not PAY in advance. Meet with the seller first.
              </p>
            </div>
          </div>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-[#0C0D19] mb-6">
                More from {product.categoryName}
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
                      image={relatedProduct.image}
                      title={relatedProduct.title}
                      description={relatedProduct.description}
                      badge={`$ ${relatedProduct.price}`}
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
