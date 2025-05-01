import React from "react";

const Input = ({ handleChange, value, title, name, color, checked }) => {
  return (
    <label className="sidebar-label-container">
      <input
        onChange={handleChange}
        type="radio"
        value={value}
        name={name}
        checked={checked}
      />
      <em
        className="checkmark"
        style={color ? { backgroundColor: color } : {}}
        aria-hidden="true"
      ></em>
      {title}
    </label>
  );
};

export default Input;