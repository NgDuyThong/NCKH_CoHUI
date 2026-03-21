/**
 * Frontend Test Helpers
 * Utilities cho React Testing Library
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

/**
 * Custom render với Router và Redux
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({ reducer: {}, preloadedState }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Mock user data
 */
export const createMockUser = (overrides = {}) => {
  return {
    userID: 1,
    fullname: 'Test User',
    email: 'test@example.com',
    phone: '0901234567',
    gender: 'male',
    role: 'customer',
    ...overrides
  };
};

/**
 * Mock product data
 */
export const createMockProduct = (overrides = {}) => {
  return {
    productID: 1,
    name: 'Test Product',
    description: 'Test description',
    price: 200000,
    categoryID: 1,
    targetID: 1,
    thumbnail: 'test.jpg',
    isActivated: true,
    ...overrides
  };
};

/**
 * Mock cart item
 */
export const createMockCartItem = (overrides = {}) => {
  return {
    productID: 1,
    name: 'Test Product',
    price: 200000,
    quantity: 1,
    thumbnail: 'test.jpg',
    ...overrides
  };
};

/**
 * Wait for async operations
 */
export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock axios response
 */
export const createMockAxiosResponse = (data, status = 200) => {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  };
};

/**
 * Mock axios error
 */
export const createMockAxiosError = (message, status = 400) => {
  const error = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Bad Request'
  };
  return error;
};
