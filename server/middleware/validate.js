const { validationResult } = require('express-validator');

/**
 * Middleware factory: runs express-validator chains and returns 422 with
 * field-level errors if any validation fails.
 *
 * Usage:
 *   router.post('/', [...validationChains], validate, controller);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    // Provide the first specific validation error message instead of generic "Validation failed"
    const firstErrorMessage = errorList[0]?.message || 'Validation failed';
    return res.status(422).json({
      message: firstErrorMessage,
      errors: errorList,
    });
  }
  next();
};

module.exports = validate;


