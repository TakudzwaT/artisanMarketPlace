import { render, screen } from "@testing-library/react";
import AboutUs from "./About";
import React from "react";
import Navi from "./components/sellerNav";

// Mock the sellerNav component to avoid rendering its internals
jest.mock("./components/sellerNav", () => () => <nav>Mocked Navi</nav>);

describe("AboutUs Component", () => {
  test("renders header and introductory text", () => {
    render(<AboutUs />);
    expect(screen.getByText("Welcome to Local Artisan!")).toBeInTheDocument();
    expect(
      screen.getByText(/We're a team of passionate creators/i)
    ).toBeInTheDocument();
  });

  test("renders all team members", () => {
    const { getByText } = render(<AboutUs />);
    expect(getByText(/Matimu Khosa/i)).toBeInTheDocument();
    expect(getByText(/Muhluri Myambo/i)).toBeInTheDocument();
    expect(getByText(/Takudzwa Mhizha/i)).toBeInTheDocument();
    expect(getByText(/Steven Mabasa/i)).toBeInTheDocument();
    expect(getByText(/Lazola Simane/i)).toBeInTheDocument();
  });

  test("renders the mocked navigation component", () => {
    render(<AboutUs />);
    expect(screen.getByText("Mocked Navi")).toBeInTheDocument();
  });

  test("renders closing message", () => {
    render(<AboutUs />);
    expect(
      screen.getByText(/We are on a mission to make buying local feel global/i)
    ).toBeInTheDocument();
  });
});
