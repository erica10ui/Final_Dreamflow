const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Journal entry validation
const validateJournalEntry = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description is required'),
  body('mood')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Mood must be less than 10 characters'),
  body('sleepQuality')
    .optional()
    .isIn(['Poor', 'Fair', 'Good', 'Great', 'Excellent'])
    .withMessage('Sleep quality must be one of: Poor, Fair, Good, Great, Excellent'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('dreamDate')
    .isISO8601()
    .withMessage('Dream date must be a valid date'),
  handleValidationErrors
];

// Sleep session validation
const validateSleepSession = [
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('quality')
    .optional()
    .isIn(['Poor', 'Fair', 'Good', 'Great', 'Excellent'])
    .withMessage('Sleep quality must be one of: Poor, Fair, Good, Great, Excellent'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors
];

// User preferences validation
const validateUserPreferences = [
  body('sleepGoal')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Sleep goal must be between 1 and 24 hours'),
  body('bedtime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Bedtime must be in HH:MM format'),
  body('wakeTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Wake time must be in HH:MM format'),
  body('soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean'),
  body('notificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('Notifications enabled must be a boolean'),
  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

const validateNewPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateJournalEntry,
  validateSleepSession,
  validateUserPreferences,
  validatePasswordReset,
  validateNewPassword,
  handleValidationErrors
};
