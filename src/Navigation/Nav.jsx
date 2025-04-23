import { FiHeart } from "react-icons/fi";
import { AiOutlineShoppingCart, AiOutlineUserAdd } from "react-icons/ai";
import "./Nav.css";

const Nav = ({ handleInputChange, query }) => {
  return (
    <nav className="nav-container">
      <form role="search" className="search-form">
        <label htmlFor="search" className="sr-only">
          Search items
        </label>
        <input
          id="search"
          className="search-input"
          type="text"
          onChange={handleInputChange}
          value={query}
          placeholder="Search items."
        />
      </form>

      <ul className="profile-container" role="list">
        <li>
          <a href="#" aria-label="Favorites">
            <FiHeart className="nav-icons" />
          </a>
        </li>
        <li>
          <a href="#" aria-label="Cart">
            <AiOutlineShoppingCart className="nav-icons" />
          </a>
        </li>
        <li>
          <a href="#" aria-label="User profile">
            <AiOutlineUserAdd className="nav-icons" />
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
