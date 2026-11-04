// In-memory token bucket rate limiter (chưa cần Redis cho demo)
const store = new Map();

function createLimiter({ windowMs, max, message }) {
  return (req, res, next) => {
    // Ưu tiên IP thực khi sau proxy, fallback socket IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.socket.remoteAddress ||
               'unknown';
    const key = `${req.baseUrl}${req.path}:${ip}`;
    const now = Date.now();

    let record = store.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: message || 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        retryAfter,
      });
    }

    next();
  };
}

// Dọn dẹp store mỗi 10 phút để tránh memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,                   // 10 lần sai/15 phút
  message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

export const otpLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 lần trong môi trường phát triển để test thoải mái
  message: 'Quá giới hạn gửi mã xác thực. Vui lòng thử lại sau 1 giờ.',
});

export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,                   // 3 tài khoản mới/giờ/IP
  message: 'Quá giới hạn đăng ký tài khoản từ IP này. Vui lòng thử lại sau.',
});
