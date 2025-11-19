// // src/utils/storage.js

// /**
//  * Retrieves an item from localStorage and parses it as JSON.
//  * @param {string} key The key of the item to retrieve.
//  * @param {*} defaultValue The default value to return if the item doesn't exist.
//  * @returns {any} The parsed item from localStorage or the default value.
//  */
// export const getItem = (key, defaultValue = []) => {
//   try {
//     const item = localStorage.getItem(key);
//     return item ? JSON.parse(item) : defaultValue;
//   } catch (error) {
//     console.error(`Error getting item "${key}" from localStorage`, error);
//     return defaultValue;
//   }
// };

// /**
//  * Saves an item to localStorage after stringifying it.
//  * @param {string} key The key of the item to save.
//  * @param {any} value The value to save.
//  */
// export const setItem = (key, value) => {
//   try {
//     localStorage.setItem(key, JSON.stringify(value));
//   } catch (error) {
//     console.error(`Error setting item "${key}" in localStorage`, error);
//   }
// };

// // Initialize default users if they don't exist
// const initializeUsers = () => {
//   const users = getItem('users', null);
//   if (users === null) {
//     setItem('users', [
//       { username: 'admin', password: 'admin123', role: 'admin', shop: 'all' },
//       { username: 'manager1', password: 'manager123', role: 'manager', shop: 'shop1' },
//       { username: 'cashier1', password: 'cashier123', role: 'cashier', shop: 'shop1' },
//       { username: 'manager2', password: 'manager123', role: 'manager', shop: 'shop2' },
//       { username: 'cashier2', password: 'cashier123', role: 'cashier', shop: 'shop2' },
//       { username: 'manager3', password: 'manager123', role: 'manager', shop: 'shop3' },
//       { username: 'cashier3', password: 'cashier123', role: 'cashier', shop: 'shop3' }
//     ]);
//   }
// };

// initializeUsers();


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
const initializeUsers = () => {
  const users = getItem('users', null);
  if (users === null) {
    setItem('users', [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'manager', password: 'manager123', role: 'manager' },
      { username: 'cashier', password: 'cashier123', role: 'cashier' }
    ]);
  }
};

initializeUsers();