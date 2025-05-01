import Category from "./Category/Category.jsx";
import Price from "./Price/Price.jsx";
import Colors from "./Colors/Colors.jsx";
import "./Sidebar.css";

const Sidebar = ({
  handleCategoryChange,
  handlePriceChange,
  handleColorChange,
  selectedCategory,
  selectedPrice,
  selectedColor
}) => {
  return (
    <aside className="sidebar" aria-label="Product Filters">
      <header className="logo-container">
        <h1 aria-label="Filters">Filters</h1>
      </header>
      
      <Category 
        handleChange={handleCategoryChange} 
        selectedValue={selectedCategory}
      />
      <Price 
        handleChange={handlePriceChange} 
        selectedValue={selectedPrice}
      />
      <Colors 
        handleChange={handleColorChange} 
        selectedValue={selectedColor}
      />
    </aside>
  );
};

export default Sidebar;