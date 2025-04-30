import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path as needed
import Products from "./Products/Products";
import Recommended from "./Recommended/Recommended";
import Sidebar from "./Sidebar/Sidebar";

const BuyerHome = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collectionGroup(db, "products"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
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

  const filteredData = () => {
    return products
      .filter((product) => {
        const matchCategory = selectedCategory
          ? product.category?.toLowerCase() === selectedCategory.toLowerCase()
          : true;
        const matchPrice = selectedPrice
          ? Number(product.newPrice) <= Number(selectedPrice)
          : true;
        const matchColor = selectedColor
          ? product.color?.toLowerCase() === selectedColor.toLowerCase()
          : true;

        return matchCategory && matchPrice && matchColor;
      })
      .map((product) => (
        <div key={product.id} className="card">
          <img src={product.imageUrl || "placeholder.jpg"} alt={product.name || "Product"} />
          <h3>{product.name || "Untitled"}</h3>
          <p>⭐ {product.star || 0} ({product.reviews || 0} reviews)</p>
          <p><del>R{product.price || 0}</del> <strong>R{product.price || 0}</strong></p>
        </div>
      ));
  };

  return (
    <div className="buyer-home-container">
      <Sidebar handleChange={handleCategoryChange} />
      <main className="main-content">
        <Recommended handleClick={handleRecommendedClick} />
        <Products result={filteredData()} />
      </main>
    </div>
  );
};

export default BuyerHome;
