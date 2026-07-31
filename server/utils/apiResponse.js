export const sendSuccess = (res, statusCode, data = null, message = 'Success') => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

export default sendSuccess;
