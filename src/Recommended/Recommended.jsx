import Button from "../components/BuyerHomeButton.jsx";
import "./Recommended.css";

const Recommended = ({ handleClick }) => {
  return (
    <section aria-labelledby="recommended-heading" className="recommended-section">
      <h2 id="recommended-heading" className="recommended-title">Recommended</h2>
      <ul className="recommended-flex">
        <li>
          <Button onClickHandler={handleClick} value="" title="All Products" />
        </li>
        <li>
          <Button onClickHandler={handleClick} value="Artful Home" title="Artful Home" />
        </li>
        <li>
          <Button onClickHandler={handleClick} value="CraftCorner" title="CraftCorner" />
        </li>
        <li>
          <Button onClickHandler={handleClick} value="EcoCrafts" title="EcoCrafts" />
        </li>
        <li>
          <Button onClickHandler={handleClick} value="WoodenWonders" title="WoodenWonders" />
        </li>
      </ul>
    </section>
  );
};

export default Recommended;
