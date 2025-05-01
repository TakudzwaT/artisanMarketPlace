import "./Colors.css";
import Input from "../../components/BuyerHomeInput.jsx";

const Colors = ({ handleChange, selectedValue }) => {
  return (
    <section className="colors-section" aria-labelledby="colors-heading">
      <h2 id="colors-heading" className="sidebar-title color-title">Colors</h2>
      <fieldset className="color-options">
        <legend className="sr-only">Select a color</legend>
        <label className="sidebar-label-container">
          <input 
            onChange={handleChange} 
            type="radio" 
            value="" 
            name="color"
            checked={selectedValue === ""} 
          />
          <em className="checkmark all" aria-hidden="true"></em>
          All
        </label>
        <Input
          handleChange={handleChange}
          value="black"
          title="Black"
          name="color"
          color="black"
          checked={selectedValue === "black"}
        />
        <Input
          handleChange={handleChange}
          value="blue"
          title="Blue"
          name="color"
          color="blue"
          checked={selectedValue === "blue"}
        />
        <Input
          handleChange={handleChange}
          value="red"
          title="Red"
          name="color"
          color="red"
          checked={selectedValue === "red"}
        />
        <Input
          handleChange={handleChange}
          value="green"
          title="Green"
          name="color"
          color="green"
          checked={selectedValue === "green"}
        />
        <label className="sidebar-label-container">
          <input
            onChange={handleChange}
            type="radio"
            value="white"
            name="color"
            checked={selectedValue === "white"}
          />
          <em
            className="checkmark"
            style={{ backgroundColor: "white", border: "2px solid black" }}
            aria-hidden="true"
          ></em>
          White
        </label>
      </fieldset>
    </section>
  );
};

export default Colors;