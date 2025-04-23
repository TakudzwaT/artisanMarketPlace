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
          <section className="total-reviews">{reviews}</section>
        </section>
      </header>

      <footer className="card-price">
        <section className="price">
          <del>{prevPrice}</del> {newPrice}
        </section>
        <button className="bag" aria-label="Add to cart">
          <BsFillBagFill className="bag-icon" />
        </button>
      </footer>
    </article>
  );
};

export default Card;
