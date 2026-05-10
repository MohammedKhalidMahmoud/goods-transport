const crypto = require('crypto');

function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(digits.length)];
  }
  return otp;
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

function pick(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => keys.includes(key))
  );
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

module.exports = { generateOtp, generateToken, omit, pick, slugify };
