import ApiError from '../utils/apiError.js';

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Forbidden: role "${req.user.role}" cannot perform this action`)
    );
  }
  next();
};

export default authorize;
