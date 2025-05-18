import Input from "../../components/BuyerHomeInput";
import "./Price.css";

const Price = ({ handleChange, selectedValue }) => {
  return (
    <section className="price-section ml" aria-labelledby="price-heading">
      <h2 id="price-heading" className="sidebar-title price-title">Price</h2>
      <fieldset className="price-options">
        <legend className="sr-only">Select a price range</legend>
        <label className="sidebar-label-container">
          <input 
            onChange={handleChange} 
            type="radio" 
            value="" 
            name="price"
            checked={selectedValue === ""}
          />
          <em className="checkmark" aria-hidden="true"></em>
          All
        </label>
        <Input
          handleChange={handleChange}
          value={50}
          title="R0 - R50"
          name="price"
          checked={selectedValue === "50"}
        />
        <Input
          handleChange={handleChange}
          value={100}
          title="R50 - R100"
          name="price"
          checked={selectedValue === "100"}
        />
        <Input
          handleChange={handleChange}
          value={150}
          title="R100 - R150"
          name="price"
          checked={selectedValue === "150"}
        />
        <Input
          handleChange={handleChange}
          value={200}
          title="R150 - R200"
          name="price"
          checked={selectedValue === "200"}
        />
        <Input
          handleChange={handleChange}
          value={250}
          title="R200 - R250"
          name="price"
          checked={selectedValue === "250"}
        />
        <Input
          handleChange={handleChange}
          value={1000}
          title="R200 - R1000"
          name="price"
          checked={selectedValue === "1000"}
        />
        <Input
          handleChange={handleChange}
          value={5000000}
          title="R1000+"
          name="price"
          checked={selectedValue === "5000000"}
        />
        
        
      </fieldset>
    </section>
  );
};

export default Price;