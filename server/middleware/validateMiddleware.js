import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array({ onlyFirstError: true })[0];
    const msg =
      first.msg === 'Invalid value'
        ? `Invalid value for field "${first.path}"`
        : first.msg;
    return next(new ApiError(400, msg));
  }
  next();
};

export default validate;
