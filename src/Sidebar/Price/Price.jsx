import Input from "../../components/BuyerHomeInput";
import "./Price.css";

const Price = ({ handleChange }) => {
  return (
    <section className="price-section ml" aria-labelledby="price-heading">
      <h2 id="price-heading" className="sidebar-title price-title">Price</h2>

      <fieldset className="price-options">
        <legend className="sr-only">Select a price range</legend>

        <label className="sidebar-label-container">
          <input onChange={handleChange} type="radio" value="" name="test2" />
          <span className="checkmark"></span>All
        </label>

        <Input
          handleChange={handleChange}
          value={50}
          title="R0 - R50"
          name="test2"
        />

        <Input
          handleChange={handleChange}
          value={100}
          title="R50 - R100"
          name="test2"
        />

        <Input
          handleChange={handleChange}
          value={150}
          title="R100 - R150"
          name="test2"
        />

        <Input
          handleChange={handleChange}
          value={200}
          title="R150 - R200"
          name="test2"
        />
        
        <Input
          handleChange={handleChange}
          value={250}
          title="R200 - R250"
          name="test2"
        />
      </fieldset>
    </section>
  );
};

export default Price;
