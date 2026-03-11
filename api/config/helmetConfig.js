const helmetOptions = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "upgrade-insecure-requests": [],
    },
  },
  crossOriginResourcePolicy: { policy: "same-origin" },
  hsts: { maxAge: 31536000, preload: true },
  referrerPolicy: { policy: "no-referrer" },
};

module.exports = helmetOptions;
