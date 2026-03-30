const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Always log 500s so they appear in Railway logs
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl} →`, err.stack || err.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    // Application unique index: { project, applicant, roleApplyingFor }
    if (fields.includes('project') && fields.includes('applicant')) {
      message = 'You have already applied for this role on this project';
    } else {
      const field = fields[0] || 'Field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
