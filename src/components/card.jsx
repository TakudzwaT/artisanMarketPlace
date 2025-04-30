import "./TrackCard.css"

function Card(prop) {
    // Function to determine the status color
    const getStatusColor = () => {
      switch(prop.status?.toLowerCase()) {
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
    
    return (
      <article className="card">
        <figure className="card-image-container">
          <img className="card-image" alt="product image" src={prop.Img} />
        </figure>
        <section className="card-details">
          <header className="card-header">
            <h2 className="card-title">{prop.OrderID}</h2>
            <section className={`status-tag ${getStatusColor()}`}>
              {prop.status || 'Pending'}
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