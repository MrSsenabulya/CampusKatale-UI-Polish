import {
  AdCard,
  Scroll,
  Navbar,
  Footer,
  Hero,
  TopCategories,
} from "../components";
import { useEffect, useState } from "react";
import "@fontsource-variable/lexend";
import { useNavigate, useLocation } from "react-router-dom";

function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(location.search);
        const category = params.get("category");

        const STRAPI_URL = "https://campuskatale-fwih.onrender.com";

        let url = `${STRAPI_URL}/api/products?populate=*`;

        // If category filter exists
        if (category) {
          url = `${STRAPI_URL}/api/products?filters[category][slug][$eq]=${category}&populate=*`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const formattedProducts = data.data.map((item) => ({
          id: item.id,
          image: item.image?.url || "",
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category?.data?.attributes?.name || "",
          badge: `$ ${item.price}`,
          buttonText: "View Details",
          productId: item.documentId,
        }));

        setAllProducts(formattedProducts);
        setProducts(formattedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [location.search]);

  // Filter and sort products
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("q")?.toLowerCase().trim() || "";

    let filtered = [...allProducts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((product) => {
        const titleMatch = product.title.toLowerCase().includes(searchQuery);
        const descMatch = product.description
          .toLowerCase()
          .includes(searchQuery);
        return titleMatch || descMatch;
      });
    }

    // Apply price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter((product) => {
        const price = product.price || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply sorting
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setProducts(filtered);
  }, [location.search, allProducts, sortBy, priceRange]);

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading)
    return (
      <div className="flex products-center justify-center h-screen bg-[#F9FAFB] font-[Lexend]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#177529] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#177529] font-medium">Loading products...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex products-center justify-center h-screen bg-[#F9FAFB] font-[Lexend]">
        <div className="text-center text-[#177529]">
          <p className="text-lg font-semibold mb-2">⚠️ Error</p>
          <p>{error}</p>
        </div>
      </div>
    );

  const params = new URLSearchParams(location.search);
  const hasSearchOrFilter = params.get("q") || params.get("category");
  const searchQuery = params.get("q");
  const categoryFilter = params.get("category");

  const handleClearFilters = () => {
    setSortBy("relevance");
    setPriceRange({ min: "", max: "" });
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="pt-20 bg-white flex-grow">
        {!hasSearchOrFilter && <Hero />}
        {!hasSearchOrFilter && <TopCategories />}
        <main className="font-[Lexend] bg-white py-8 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex products-center justify-between mb-6">
              <h1 className="text-xl md:text-2xl font-semibold text-[#0C0D19]">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : categoryFilter
                    ? `Products in ${categoryFilter.replace(/-/g, " ")}`
                    : "Browse Latest Listings"}
              </h1>
              {hasSearchOrFilter && (
                <button
                  onClick={handleClearFilters}
                  className="text-[#177529] font-medium hover:text-[#97C040] transition-colors"
                >
                  Clear Filters
                </button>
              )}
              {!hasSearchOrFilter && (
                <a
                  href="#"
                  className="text-[#177529] font-medium hover:text-[#97C040] transition-colors"
                >
                  View All &gt;
                </a>
              )}
            </div>

            {/* Filter Section - shown when searching or filtering */}
            {hasSearchOrFilter && (
              <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Sort By */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#0C0D19] mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#177529] bg-white text-[#0C0D19] font-[Lexend]"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#0C0D19] mb-2">
                      Price Range ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, min: e.target.value })
                        }
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#177529] bg-white text-[#0C0D19] font-[Lexend]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, max: e.target.value })
                        }
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#177529] bg-white text-[#0C0D19] font-[Lexend]"
                      />
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="flex products-end">
                    <p className="text-sm text-gray-600">
                      {products.length}{" "}
                      {products.length === 1 ? "product" : "products"} found
                    </p>
                  </div>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-t-transparent border-[#177529] rounded-full animate-spin"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <AdCard
                    key={product.productId}
                    {...product}
                    onButtonClick={() => handleViewDetails(product.productId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#6B7280] text-lg mb-2">
                  No products found.
                </p>
                {new URLSearchParams(location.search).get("q") && (
                  <p className="text-[#6B7280] text-sm">
                    Try a different search term.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
        <Scroll />
      </div>
      <Footer />
    </div>
  );
}

export default Home;
