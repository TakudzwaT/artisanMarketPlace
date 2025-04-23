import { BsFillBagFill } from "react-icons/bs";

const Card = ({ img, title, star, reviews, prevPrice, newPrice }) => {
  return (
    <article className="card">
      <figure>
        <img src={img} alt={title} className="card-img" />
        <figcaption className="sr-only">{title}</figcaption>
      </figure>

      <header className="card-details">
        <h3 className="card-title">{title}</h3>
        <section className="card-reviews" aria-label="Product reviews">
          {star} {star} {star} {star}
          <span className="total-reviews">{reviews}</span>
        </section>
      </header>

      <footer className="card-price">
        <span className="price">
          <del>{prevPrice}</del> {newPrice}
        </span>
        <button className="bag" aria-label="Add to cart">
          <BsFillBagFill className="bag-icon" />
        </button>
      </footer>
    </article>
  );
};

export default Card;
