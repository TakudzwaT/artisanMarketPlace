import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path as needed
import BuyerHomeCard from "./components/BuyerHomeCard";
import Recommended from "./Recommended/Recommended";
import Sidebar from "./Sidebar/Sidebar";
import Nav from "./components/nav";
import "./styling/BuyerHome.css";

const BuyerHome = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  
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
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  const handleRecommendedClick = (value) => {
    setSelectedCategory(value);
  };
  
  const handlePriceChange = (e) => {
    setSelectedPrice(e.target.value);
  };
  
  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
  };
  
  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory
      ? product.category?.toLowerCase() === selectedCategory.toLowerCase()
      : true;
    
    const matchPrice = selectedPrice
      ? Number(product.newPrice || product.price) <= Number(selectedPrice)
      : true;
    
    const matchColor = selectedColor
      ? product.color?.toLowerCase() === selectedColor.toLowerCase()
      : true;
    
    return matchCategory && matchPrice && matchColor;
  });
  
  return (
    <div className="buyer-home-container">
      <Nav />
      <div className="buyer-home-content">
        <Sidebar 
          handleCategoryChange={handleCategoryChange} 
          handlePriceChange={handlePriceChange}
          handleColorChange={handleColorChange}
        />
        <main className="buyer-main-content">
          <Recommended handleClick={handleRecommendedClick} />
          
          {loading ? (
            <div className="buyer-loading">Loading products...</div>
          ) : (
            <section className="buyer-card-container">
              {filteredProducts.length === 0 ? (
                <div className="buyer-no-products">No products found matching your criteria</div>
              ) : (
                filteredProducts.map((product) => (
                  <BuyerHomeCard
                    key={product.id}
                    img={product.imageUrl || "/placeholder.jpg"}
                    title={product.name || "Product"}
                    star={product.star || 0}
                    reviews={product.reviews || 0}
                    prevPrice={`R${product.prevPrice || product.price}`}
                    newPrice={`R${product.newPrice || product.price}`}
                  />
                ))
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default BuyerHome;