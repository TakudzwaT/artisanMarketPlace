// src/BuyerHome.jsx
import React, { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from './firebase';
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
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // (Filter logic omitted for brevity; assume existing handlers are defined above)

  return (
    <main className="buyer-home-container">
      <header>
        <Nav />
      </header>
      <section className="buyer-home-content">
        <Sidebar
          handleCategoryChange={setSelectedCategory}
          handlePriceChange={setSelectedPrice}
          handleColorChange={setSelectedColor}
          selectedCategory={selectedCategory}
          selectedPrice={selectedPrice}
          selectedColor={selectedColor}
        />
        <section className="buyer-main-content">
          <LoadCredits />
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search products"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setSelectedPrice("");
                setSelectedColor("");
                setSearchQuery("");
              }}
              className="reset-button"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          </form>
          <section aria-labelledby="recommended-heading">
            <h2 id="recommended-heading" className="sr-only" />
            <Recommended handleClick={setSelectedCategory} />
          </section>
          <ul className="buyer-card-container" aria-label="Product List">
            {loading ? (
              <li className="buyer-loading">Loading products...</li>
            ) : (
              products
                .filter((product) => {
                  // apply existing filter logic here using selectedCategory, selectedPrice, selectedColor, searchQuery
                  return true;
                })
                .map((product) => (
                  <li key={product.id} className="product-item">
                    <BuyerHomeCard product={product} />
                  </li>
                ))
            )}
          </ul>
        </section>
      </section>
    </main>
  );
}