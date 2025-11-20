// src/utils/storage.js

/**
 * Retrieves an item from localStorage and parses it as JSON.
 * @param {string} key The key of the item to retrieve.
 * @param {*} defaultValue The default value to return if the item doesn't exist.
 * @returns {any} The parsed item from localStorage or the default value.
 */
export const getItem = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage`, error);
    return defaultValue;
  }
};

/**
 * Saves an item to localStorage after stringifying it.
 * @param {string} key The key of the item to save.
 * @param {any} value The value to save.
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item "${key}" in localStorage`, error);
  }
};

// Initialize default users if they don't exist

export const initializeUsers = () => {
  const users = getItem('users', null);
  if (users === null) {
    setItem('users', [
      // Admin - Full access
      { username: 'admin', password: 'admin123', role: 'admin', shop: 'all' },
      
      // Shop 1 - Main Grocery (attached to warehouse)
      { username: 'manager1', password: 'manager123', role: 'manager', shop: 'shop1' },
      { username: 'patience', password: 'cashier123', role: 'cashier', shop: 'shop1' },
      
      // Kaard Shop - GTS
      { username: 'manager2', password: 'manager123', role: 'manager', shop: 'shop2' },
      { username: 'monalissa', password: 'cashier123', role: 'cashier', shop: 'shop2' },
      
      // Kaard Supermarket - Quickstop
      { username: 'manager3', password: 'manager123', role: 'manager', shop: 'shop3' },
      { username: 'shelter', password: 'cashier123', role: 'cashier', shop: 'shop3' },
      
      // Kaard Liquor - GTS
      { username: 'manager4', password: 'manager123', role: 'manager', shop: 'shop4' },
      { username: 'catherine', password: 'cashier123', role: 'cashier', shop: 'shop4' },
      
      // Kaard Liquor - Masasa
      { username: 'manager5', password: 'manager123', role: 'manager', shop: 'shop5' },
      { username: 'charmaine', password: 'cashier123', role: 'cashier', shop: 'shop5' },
      
      // Fancy Liquor - Kadoma
      { username: 'manager6', password: 'manager123', role: 'manager', shop: 'shop6' },
      { username: 'charline', password: 'cashier123', role: 'cashier', shop: 'shop6' }
    ]);
  }
};

initializeUsers();