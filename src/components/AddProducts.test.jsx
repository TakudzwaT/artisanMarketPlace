
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddProduct from './AddProducts'
import { collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

// Mock the necessary modules
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn()
}))

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
}))

vi.mock('../firebase', () => ({
  db: {},
  storage: {}
}))

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}))

describe('AddProduct Component', () => {
  // Set up local storage mock
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-store-id'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })
    
    // Reset mocks between tests
    vi.clearAllMocks()
  })

  test('renders AddProduct component correctly', () => {
    render(<AddProduct />)
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument()
    expect(screen.getByLabelText('Product Image')).toBeInTheDocument()
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Product' })).toBeInTheDocument()
  })

  test('updates form values when input changes', () => {
    render(<AddProduct />)
    
    const nameInput = screen.getByLabelText('Product Name')
    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    expect(nameInput.value).toBe('Test Product')
    
    const categoryInput = screen.getByLabelText('Category')
    fireEvent.change(categoryInput, { target: { value: 'Test Category' } })
    expect(categoryInput.value).toBe('Test Category')
    
    const priceInput = screen.getByLabelText('Price')
    fireEvent.change(priceInput, { target: { value: 'R250' } })
    expect(priceInput.value).toBe('R250')
    
    const stockInput = screen.getByLabelText('Quantity')
    fireEvent.change(stockInput, { target: { value: '10' } })
    expect(stockInput.value).toBe('10')
  })

  test('handles file input changes', () => {
    render(<AddProduct />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText('Product Image')
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    })
    
    fireEvent.change(fileInput)
    
    // Can't directly test the state, but we can verify the input accepts the file
    expect(fileInput.files[0]).toBe(file)
  })

  test('submits form and uploads product correctly', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate
    }))
    
    // Set up successful API responses
    ref.mockReturnValue('mock-storage-ref')
    uploadBytes.mockResolvedValue({ ref: 'mock-ref' })
    getDownloadURL.mockResolvedValue('https://example.com/image.jpg')
    collection.mockReturnValue('mock-collection')
    addDoc.mockResolvedValue({ id: 'new-product-id' })
    
    render(<AddProduct />)
    
    // Fill out the form
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText('Product Image')
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    })
    fireEvent.change(fileInput)
    
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Test Category' } })
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: 'R250' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }))
    
    // Verify loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    
    // Wait for the submission to complete
    await waitFor(() => {
      // Check that the functions were called with correct parameters
      expect(ref).toHaveBeenCalledWith(storage, 'stores/test-store-id/products/mock-uuid')
      expect(uploadBytes).toHaveBeenCalledWith('mock-storage-ref', file)
      expect(getDownloadURL).toHaveBeenCalledWith('mock-storage-ref')
      expect(collection).toHaveBeenCalledWith(db, 'stores', 'test-store-id', 'products')
      expect(addDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Test Product',
        category: 'Test Category',
        price: 'R250',
        stock: 10,
        status: 'Active',
        imageUrl: 'https://example.com/image.jpg'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/manage')
    })
  })

  test('handles form submission errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock an error in the upload process
    ref.mockReturnValue('mock-storage-ref')
    uploadBytes.mockRejectedValue(new Error('Upload failed'))
    
    render(<AddProduct />)
    
    // Fill out the form minimally to make it valid
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText('Product Image')
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    })
    fireEvent.change(fileInput)
    
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Category' } })
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: 'R100' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Save Product' }))
    
    // Wait for the submission to fail
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error uploading product:', expect.any(Error))
      expect(screen.getByRole('button', { name: 'Save Product' })).toBeInTheDocument()
    })
    
    consoleErrorSpy.mockRestore()
  })
})