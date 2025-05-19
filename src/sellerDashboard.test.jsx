import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SellerDashboard from "./sellerDashboard";

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock firebase/auth
jest.mock("firebase/auth", () => {
  const originalModule = jest.requireActual("firebase/auth");
  return {
    ...originalModule,
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn()
  };
});

// Mock firebase/firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

// Mock html2canvas and jsPDF
jest.mock("html2canvas", () => jest.fn(() => Promise.resolve({ 
  toDataURL: () => "mock-image-data", 
  height: 1000, 
  width: 1000 
})));

jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  }));
});

// Mock child component
jest.mock("./components/sellerNav", () => () => <nav data-testid="navi">Mock Navi</nav>);

describe("SellerDashboard", () => {
  const mockFirebaseAuth = require("firebase/auth");
  const mockFirestore = require("firebase/firestore");
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", async () => {
    // Setup auth mock to return logged in user
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "testUser" });
      return jest.fn();
    });

    // Setup firestore mock to return store data
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        storeName: "Test Store",
        ownerName: "Test Owner",
        paymentMethod: "Cash",
        storeBio: "Test Bio"
      })
    });
    mockFirestore.getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });

    render(<SellerDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading your dashboard/i)).not.toBeInTheDocument();
    });
  });

  it("renders login required screen if not logged in", async () => {
    // Mock not logged in and no stored seller ID
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // simulate not logged in
      return jest.fn();
    });
    localStorageMock.getItem.mockReturnValue(null);

    render(<SellerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Seller Login Required/i)).toBeInTheDocument();
    });
  });

  it("renders export buttons and handles click", async () => {
    // Setup auth mock to return logged in user
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "testUser" });
      return jest.fn();
    });

    // Setup firestore mock to return store data
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        storeName: "Test Store",
        ownerName: "Test Owner",
        paymentMethod: "Cash",
        storeBio: "Test Bio"
      })
    });
    mockFirestore.getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });

    render(<SellerDashboard />);
    
    // Wait for the dashboard to fully load
    await waitFor(() => {
      expect(screen.queryByText(/Loading your dashboard/i)).not.toBeInTheDocument();
    });
    
    const exportBtn = screen.getByRole("button", { name: /Export as PDF/i });
    expect(exportBtn).toBeInTheDocument();
    
    fireEvent.click(exportBtn);
    // No explicit assertion needed, we're testing that it doesn't crash
  });

  it("renders date filter inputs", async () => {
    // Setup auth mock to return logged in user
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "testUser" });
      return jest.fn();
    });

    // Setup firestore mock to return store data
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        storeName: "Test Store",
        ownerName: "Test Owner",
        paymentMethod: "Cash",
        storeBio: "Test Bio"
      })
    });
    mockFirestore.getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });

    render(<SellerDashboard />);
    
    // Wait for the dashboard to fully load
    await waitFor(() => {
      expect(screen.queryByText(/Loading your dashboard/i)).not.toBeInTheDocument();
    });
    
    // Find the date inputs by their labels
    const fromInput = screen.getByLabelText(/From:/i);
    const toInput = screen.getByLabelText(/To:/i);
    
    expect(fromInput).toBeInTheDocument();
    expect(toInput).toBeInTheDocument();
  });

  it("handles date filter buttons", async () => {
    // Setup auth mock to return logged in user
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "testUser" });
      return jest.fn();
    });

    // Setup firestore mock to return store data
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        storeName: "Test Store",
        ownerName: "Test Owner",
        paymentMethod: "Cash",
        storeBio: "Test Bio"
      })
    });
    mockFirestore.getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });

    render(<SellerDashboard />);
    
    // Wait for the dashboard to fully load
    await waitFor(() => {
      expect(screen.queryByText(/Loading your dashboard/i)).not.toBeInTheDocument();
    });
    
    // Need to set date values to enable the Apply button
    const fromInput = screen.getByLabelText(/From:/i);
    fireEvent.change(fromInput, { target: { value: '2025-01-01' } });

    // Now the Reset button should appear and Apply should be enabled
    const applyBtn = screen.getByRole("button", { name: /Apply/i });
    
    await waitFor(() => {
      const resetBtn = screen.getByRole("button", { name: /Reset/i });
      expect(resetBtn).toBeInTheDocument();
      expect(applyBtn).not.toBeDisabled();
    });
    
    fireEvent.click(applyBtn);
    
    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);
    
    // Verify reset worked
    await waitFor(() => {
      expect(fromInput.value).toBe('');
    });
  });
});
