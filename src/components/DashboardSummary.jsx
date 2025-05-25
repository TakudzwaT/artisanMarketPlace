import React from 'react';

function DashboardSummary({ totalSales, totalRevenue, totalItems, totalProducts, loading }) {
  return (
    <>
      {loading && (
        <section className="loading-spinner" style={{ padding: "20px" }}>
          <section className="spinner"></section>
          <p>Updating data...</p>
        </section>
      )}
      <section className="dashboard-stats">
        <section className="stat-card">
          <h3>Total Sales</h3>
          <p className="stat-value">{totalSales}</p>
        </section>
        <section className="stat-card">
          <h3>Revenue</h3>
          <p className="stat-value">{totalRevenue.toFixed(2)}</p>
        </section>
        <section className="stat-card">
          <h3>Items Sold</h3>
          <p className="stat-value">{totalItems}</p>
        </section>
        <section className="stat-card">
          <h3>Products</h3>
          <p className="stat-value">{totalProducts}</p>
        </section>
      </section>
    </>
  );
}

export default DashboardSummary;