import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./seller_card";

const mockProps = {
  Img: "https://via.placeholder.com/150",
  OrderID: "12345",
  status: "processing",
  date: "2024-04-30",
  description: "A beautiful handmade vase",
  price: "49.99",
};

describe("Card Component", () => {
  test("renders card with correct details", () => {
    render(<Card {...mockProps} />);
    
    expect(screen.getByText(mockProps.OrderID)).toBeInTheDocument();
    expect(screen.getByText("Order Date:")).toBeInTheDocument();
    expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProps.price}`)).toBeInTheDocument();
    expect(screen.getByText(/Edit Status/i)).toBeInTheDocument();
  });

  test("renders initial status correctly", () => {
    render(<Card {...mockProps} />);
    const status = screen.getByText(/processing/i);
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("status-badge", "bg-yellow-500");
  });

  test("allows status editing", () => {
    render(<Card {...mockProps} />);
    
    const editButton = screen.getByRole("button", { name: /edit status/i });
    fireEvent.click(editButton);

    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();

    fireEvent.change(dropdown, { target: { value: "delivered" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText(/delivered/i)).toBeInTheDocument();
  });

  test("shows fallback text when no status is provided", () => {
    const props = { ...mockProps, status: "" };
    render(<Card {...props} />);
    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
  });
});
