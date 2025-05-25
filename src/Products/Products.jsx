import "./Products.css";
import React from "react";
const Products = ({ result }) => {
  return (
    <section className="products-section">
      <section className="products-card-container">
        {result}
      </section>
    </section>
  );
};

export default Products;