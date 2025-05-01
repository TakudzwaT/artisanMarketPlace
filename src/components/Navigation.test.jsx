import { render, screen, fireEvent, within } from "@testing-library/react";
import Navigation from "./nav";
import React from "react";

describe("Navigation component", () => {
  test("renders title and desktop menu", () => {
    render(<Navigation />);
    expect(screen.getByText("Artisan Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });

  test("renders mobile menu button", () => {
    render(<Navigation />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("☰");
  });

  test("toggles mobile menu on button click", () => {
    render(<Navigation />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(screen.getByText("✕")).toBeInTheDocument();

    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toBeInTheDocument();
    expect(within(mobileMenu).getByText("Home")).toBeInTheDocument();
    expect(within(mobileMenu).getByText("Orders")).toBeInTheDocument();
    expect(within(mobileMenu).getByText("About Us")).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveTextContent("☰");
  });
});
