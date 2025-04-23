import Category from "./Category/Category.jsx";
import Price from "./Price/Price.jsx";
import Colors from "./Colors/Colors.jsx";
import "./Sidebar.jsx";

const Sidebar = ({ handleChange }) => {
  return (
    <aside className="sidebar" aria-label="Product Filters">
      <header className="logo-container">
        <h1 aria-label="Shop Logo">🛒</h1>
      </header>
      <Category handleChange={handleChange} />
      <Price handleChange={handleChange} />
      <Colors handleChange={handleChange} />
    </aside>
  );
};

export default Sidebar;
