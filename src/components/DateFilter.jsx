import React from 'react';

function DateFilter({ startDate, endDate, handleStartDateChange, handleEndDateChange, applyDateFilter, resetDateFilter }) {
  return (
    <section className="date-filter">
      <section className="date-range-inputs">
        <label>
          From:
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            max={endDate || undefined}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
          />
        </label>
      </section>
      <section className="filter-actions">
        <button
          className="apply-btn"
          onClick={applyDateFilter}
          disabled={!(startDate || endDate)}
        >
          Apply
        </button>
        {(startDate || endDate) && (
          <button className="reset-btn" onClick={resetDateFilter}>Reset</button>
        )}
      </section>
    </section>
  );
}

export default DateFilter;