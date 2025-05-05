import React, { useState } from 'react';
import "./TrackCard.css";

function Card(props) {
  // Add state for managing the selected status
  const [selectedOption, setSelectedOption] = useState(props.status || '');
  const [isEditing, setIsEditing] = useState(false);
  
  // Function to determine the status color
  const getStatusColor = () => {
    switch(selectedOption?.toLowerCase()) {
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
  
  const handleChange = (e) => {
    setSelectedOption(e.target.value);
  };
  
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing && props.onStatusChange) {
      props.onStatusChange(selectedOption);
    }
  };
  
  // Format date to be more readable
  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown date";
    
    try {
      // Check if dateValue is a Firebase Timestamp object (has seconds and nanoseconds)
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        // Convert Firebase Timestamp to JavaScript Date
        const date = new Date(dateValue.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Check if the date is in UTC+2 format from your database
      if (typeof dateValue === 'string' && dateValue.includes("UTC+2")) {
        const parts = dateValue.split(" at ");
        return parts[0];
      }
      
      // Parse ISO date strings or other formats
      const date = new Date(dateValue);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Unknown date"; // Return placeholder if parsing fails
    }
  };
  
  // Calculate total price
  const totalPrice = (props.price * (props.quantity || 1)).toFixed(2);
  
  return (
    <article className="seller-card">
      <div className="seller-card-main">
        <figure className="seller-card-image-container">
          <img 
            className="card-image" 
            alt="product image" 
            src={props.Img} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/320";
            }}
          />
        </figure>
        
        <section className="seller-card-details">
          <header className="seller-card-header">
            <div className="seller-card-title-section">
              <h2 className="seller-card-title">Order #{props.OrderID.substring(0, 8)}...</h2>
              <p className="seller-card-date">
                <span className="label">Ordered:</span> {formatDate(props.date)}
              </p>
            </div>
            
            <section className="status-section">
              {isEditing ? (
                <select
                  value={selectedOption}
                  onChange={handleChange}
                  className={`status-select ${getStatusColor()}`}
                >
                  <option value="">Select status</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Collection</option>
                  <option value="collected">Collected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <span className={`status-badge ${getStatusColor()}`}>
                  {selectedOption || 'Processing'}
                </span>
              )}
              
              <button
                onClick={toggleEdit}
                className={`edit-status-btn ${isEditing ? 'save-btn' : 'edit-btn'}`}
              >
                {isEditing ? 'Save' : 'Edit Status'}
              </button>
            </section>
          </header>
          
          <section className="seller-card-content">
            <div className="seller-card-info">
              <p className="seller-card-description">
                {props.description}
              </p>
              
              <div className="seller-card-pricing">
                <p className="card-price">
                  <span className="label">Price:</span> R{props.price}
                </p>
                
                <p className="card-quantity">
                  <span className="label">Qty:</span> {props.quantity || 1}
                </p>
                
                <p className="card-total">
                  <span className="label">Total:</span> R{totalPrice}
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </article>
  );
}

export default Card;