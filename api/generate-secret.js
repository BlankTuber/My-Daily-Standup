// generate-secret.js
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('Your new session secret is:');
console.log(secret);
