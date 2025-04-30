import "./Products.css";

const Products = ({ result }) => {
  return (
    <section className="products-section">
      <div className="products-card-container">
        {result}
      </div>
    </section>
  );
};

export default Products;