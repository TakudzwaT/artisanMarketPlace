import React from 'react';
import './OrderCard.css';

const OrderCard = ({ description, price, date, OrderID, ProductID, Img, status, shopName }) => {
  return (
    <article className="order-card">
      <section className="order-image-container">
        <img 
          src={Img} 
          alt={description}
          className="order-image"
        />
        <span className={`order-status status-${status.toLowerCase()}`}>
          {status}
        </span>
      </section>
      
      <section className="order-content">
        <span className="shop-name">{shopName}</span>
        
        <h3 className="product-name">{description}</h3>
        
        <section className="order-details">
          <span className="product-price">
            R{parseFloat(price).toFixed(2)}
          </span>
          
          <time className="order-date" dateTime={date}>
            {date}
          </time>
        </section>
        
        <section className="order-id">
          Order #{OrderID?.substring(0, 8)}
        </section>
      </section>
    </article>
  );
};

export default OrderCard;