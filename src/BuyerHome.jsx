// src/pages/BuyerHome.jsx
import React, { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import BuyerHomeCard from "./components/BuyerHomeCard";
import Recommended from "./Recommended/Recommended";
import Sidebar from "./Sidebar/Sidebar";
import Nav from "./components/nav";
import LoadCredits from "./components/LoadCredits";
import { Search } from "lucide-react";
import "./styling/BuyerHome.css";

export default function BuyerHome() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collectionGroup(db, "products"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const matchSearch = searchQuery
      ? product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchCategory = selectedCategory
      ? product.category?.toLowerCase() === selectedCategory.toLowerCase()
      : true;

    let matchPrice = true;
    if (selectedPrice) {
      const price = Number(product.newPrice || product.price);
      if (selectedPrice === "50") matchPrice = price <= 50;
      if (selectedPrice === "100") matchPrice = price > 50 && price <= 100;
      if (selectedPrice === "150") matchPrice = price > 100 && price <= 150;
      if (selectedPrice === "200") matchPrice = price > 150 && price <= 200;
      if (selectedPrice === "250") matchPrice = price > 200 && price <= 250;
    }

    const matchColor = selectedColor
      ? product.color?.toLowerCase() === selectedColor.toLowerCase()
      : true;

    return matchSearch && matchCategory && matchPrice && matchColor;
  });

  const handleCategoryChange = (e) => setSelectedCategory(e.target.value);
  const handlePriceChange = (e) => setSelectedPrice(e.target.value);
  const handleColorChange = (e) => setSelectedColor(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleRecommendedClick = (value) => setSelectedCategory(value);
  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedPrice("");
    setSelectedColor("");
    setSearchQuery("");
  };

  return (
    <main className="buyer-home-container">
      <header>
        <Nav />
      </header>

      <section className="buyer-home-content">
        <Sidebar
          handleCategoryChange={handleCategoryChange}
          handlePriceChange={handlePriceChange}
          handleColorChange={handleColorChange}
          selectedCategory={selectedCategory}
          selectedPrice={selectedPrice}
          selectedColor={selectedColor}
        />

        <section className="buyer-main-content">
          {/* Load credits widget */}
          <LoadCredits />

          {/* Search & reset */}
          <form
            className="search-container"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="search-wrapper">
              <Search size={20} className="search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
                aria-label="Search products"
              />
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="reset-button"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          </form>

          {/* Recommended categories */}
          <section aria-labelledby="recommended-heading">
            <h2 id="recommended-heading" className="sr-only">
              Recommended Categories
            </h2>
            <Recommended handleClick={handleRecommendedClick} />
          </section>

          {/* Product grid */}
          <ul className="buyer-card-container" aria-label="Product List">
            {loading ? (
              <li className="buyer-loading">Loading products...</li>
            ) : filteredProducts.length === 0 ? (
              <li className="buyer-no-products">
                No products found matching your criteria
              </li>
            ) : (
              filteredProducts.map((product) => (
                <li key={product.id} className="product-item">
                  <BuyerHomeCard
                    img={product.imageUrl || "/placeholder.jpg"}
                    title={product.name || "Product"}
                    star={product.star || 0}
                    reviews={product.reviews || 0}
                    prevPrice={`R${product.prevPrice || product.price}`}
                    newPrice={`R${product.newPrice || product.price}`}
                    product={product}
                  />
                </li>
              ))
            )}
          </ul>
        </section>
      </section>
    </main>
  );
}
