import React from 'react';
import { format } from 'date-fns';
import DateFilter from './DateFilter'; // Import the new DateFilter component

function SalesTable({
  sales,
  startDate,
  endDate,
  handleStartDateChange,
  handleEndDateChange,
  applyDateFilter,
  resetDateFilter,
  storeId,
  loading
}) {
  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return new Date(); // Default to current date if timestamp is missing
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp); // Assuming it might be a string or number
  };

  return (
    <section className="sales-section">
      <section className="section-header">
        <h2>Sales</h2>
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          handleStartDateChange={handleStartDateChange}
          handleEndDateChange={handleEndDateChange}
          applyDateFilter={applyDateFilter}
          resetDateFilter={resetDateFilter}
        />
      </section>

      {sales.length > 0 ? (
        <section className="table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.flatMap((order) => {
                const items = order.items || {};
                return Object.values(items).map((item, itemIndex) => {
                  if (item.storeId !== storeId) return null;

                  const dateObj = formatFirestoreDate(order.purchasedAt || order.createdAt);
                  const date = format(dateObj, "yyyy-MM-dd");
                  const itemTotal = item.total || (item.price * item.qty);

                  return (
                    <tr key={`${order.id}-${itemIndex}`}>
                      <td>{order.id.substring(0, 8)}</td>
                      <td className="product-name">{item.name}</td>
                      <td>{item.qty}</td>
                      <td>{item.price}</td>
                      <td>{itemTotal.toFixed(2)}</td>
                      <td>{date}</td>
                    </tr>
                  );
                }).filter(Boolean);
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="empty-state">
          <p>
            {startDate && endDate
              ? `No sales found between ${startDate} and ${endDate}`
              : startDate
                ? `No sales found from ${startDate} onwards`
                : endDate
                  ? `No sales found until ${endDate}`
                  : "No sales records found"
            }
          </p>
        </section>
      )}
    </section>
  );
}

export default SalesTable;