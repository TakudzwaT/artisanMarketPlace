import React from 'react';

function InventoryTable({ inventory, loading }) {
  return (
    <section className="inventory-section">
      <section className="section-header">
        <h2>Inventory</h2>
      </section>

      {inventory.length > 0 ? (
        <section className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((product) => (
                <tr key={product.id}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    <section className={`status-pill ${product.status === "Active" ? "status-active" : "status-inactive"}`}>
                      {product.status || (product.stock > 0 ? "In Stock" : "Out of Stock")}
                    </section>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="empty-state">
          <p>No products in inventory</p>
          <button onClick={() => window.location.href = "/add-product"}>Add a Product</button>
        </section>
      )}
    </section>
  );
}

export default InventoryTable;