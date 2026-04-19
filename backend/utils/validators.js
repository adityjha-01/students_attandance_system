/**
 * Custom validation helper functions
 */

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Boolean}
 */
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate required fields
 * @param {Object} data - Object with data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { isValid: Boolean, missingFields: Array }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  validateRequiredFields,
};
