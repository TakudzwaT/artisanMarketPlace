import "./TrackCard.css"
import React from "react"
function Card(prop) {
    // Function to determine the status color
    const getStatusColor = () => {
      switch(prop.status?.toLowerCase()) {
        case 'collected':
          return 'bg-green-500';
        case 'ready':
          return 'bg-blue-500';
        case 'processing':
          return 'bg-yellow-500';
        case 'cancelled':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    };
    
    // Handle potential undefined/null values to prevent rendering errors
    const formatPrice = (price) => {
      // Convert to number if it's a string, or use 0 if undefined/null
      const numPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
      return numPrice.toLocaleString();
    };
    
    // Safely truncate Order ID
    const getDisplayOrderId = () => {
      if (!prop.OrderID) return "Unknown";
      return prop.OrderID.substring(0, 8) + "...";
    };
    
    return (
      <article className="card">
        <figure className="card-image-container">
          <img 
            className="card-image" 
            alt="product image" 
            src={prop.Img} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/320";
            }}
          />
        </figure>
        <section className="card-details">
          <header className="card-header">
            <section className="card-title-container">
              <h2 className="card-title">Order #{getDisplayOrderId()}</h2>
              {prop.shopName && <p className="shop-name">from {prop.shopName}</p>}
            </section>
            <section className={`status-tag ${getStatusColor()}`}>
              {prop.status || 'Pending'}
            </section>
          </header>
          <section className="card-content">
            <p className="card-date">
              <section className="label">Order Date:</section> {prop.date || 'Unknown date'}
            </p>
            <p className="card-description">
              {prop.description || 'Product'}
            </p>
            <p className="card-price">
              <section className="label">Price:</section> R{formatPrice(prop.price)}
            </p>
          </section>
        </section>
      </article>
    );
}
  
export default Card;