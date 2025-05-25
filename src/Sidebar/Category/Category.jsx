import "./Category.css";
import Input from "../../components/BuyerHomeInput.jsx";
import React from "react";

function Category({ handleChange, selectedValue }) {
  return (
    <section className="category-section" aria-labelledby="category-heading">
      <h2 id="category-heading" className="sidebar-title">Category</h2>
      <fieldset className="category-options">
        <legend className="sr-only">Select an item category</legend>
        <label className="sidebar-label-container">
          <input 
            onChange={handleChange} 
            type="radio" 
            value="" 
            name="category" 
            checked={selectedValue === ""}
          />
          <em className="checkmark" aria-hidden="true"></em>
          All
        </label>
        <Input
          handleChange={handleChange}
          value="Ceramics"
          title="Ceramics"
          name="category"
          checked={selectedValue === "Ceramics"}
        />
        <Input
          handleChange={handleChange}
          value="Jewelry"
          title="Jewelry"
          name="category"
          checked={selectedValue === "Jewelry"}
        />
        <Input
          handleChange={handleChange}
          value="textile"
          title="Textile"
          name="category"
          checked={selectedValue === "textile"}
        />
        <Input
          handleChange={handleChange}
          value="woodwork"
          title="Woodwork"
          name="category"
          checked={selectedValue === "woodwork"}
        />
        <Input
          handleChange={handleChange}
          value="other"
          title="other"
          name="category"
          checked={selectedValue === "other"}
        />
      </fieldset>
    </section>
  );
}

export default Category;