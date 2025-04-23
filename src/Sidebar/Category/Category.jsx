import "./Category.css";
import Input from "../../components/BuyerHomeInput.jsx";

function Category({ handleChange }) {
  return (
    <section className="category-section" aria-labelledby="category-heading">
      <h2 id="category-heading" className="sidebar-title">Category</h2>

      <fieldset className="category-options">
        <legend className="sr-only">Select an item category</legend>

        <label className="sidebar-label-container">
          <input onChange={handleChange} type="radio" value="" name="test" />
          <span className="checkmark"></span>All
        </label>

        <Input
          handleChange={handleChange}
          value="Ceramics"
          title="Ceramics"
          name="test"
        
        />
        <Input
          handleChange={handleChange}
          value="Jewelry"
          title="Jewelry"
          name="test"
          />
           <Input
          handleChange={handleChange}
          value="textile"
          title="Textile"
          name="test"
        />
          <Input
          handleChange={handleChange}
          value="woodwork"
          title="Woodwork"
          name="test"
        
        />
      </fieldset>
    </section>
  );
}

export default Category;
