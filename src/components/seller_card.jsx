import { useState } from 'react';
import "./TrackCard.css"

function Card(prop) {
  // Add state for managing the selected status
  const [selectedOption, setSelectedOption] = useState(prop.status || '');
  const [isEditing, setIsEditing] = useState(false);

  // Function to determine the status color
  const getStatusColor = () => {
    switch(selectedOption?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'shipped':
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
    
    if (isEditing) {
      console.log(`Status updated to: ${selectedOption}`);
    }
  };

  return (
    <article className="card">
      <figure className="card-image-container">
        <img className="card-image" alt="product image" src={prop.Img} />
      </figure>
      <section className="card-details">
        <header className="card-header">
          <h2 className="card-title">{prop.OrderID}</h2>
          <section className="status-tag">
            {isEditing ? (
              <select 
                value={selectedOption} 
                onChange={handleChange}
                className={`status-select ${getStatusColor()}`}
              >
                <option value="">Select status</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <span className={`status-badge ${getStatusColor()}`}>
                {selectedOption || 'Unknown'}
              </span>
            )}
            <button 
              onClick={toggleEdit} 
              className="edit-status-btn ml-2 px-2 py-1 bg-blue-600 text-white rounded"
            >
              {isEditing ? 'Save' : 'Edit Status'}
            </button>
          </section>
        </header>
        <section className="card-content">
          <p className="card-date">
            <span className="label">Order Date:</span> {prop.date}
          </p>
          <p className="card-description">
            {prop.description}
          </p>
          <p className="card-price">
            <span className="label">Price:</span> ${prop.price}
          </p>
        </section>
      </section>
    </article>
  );
}

export default Card;