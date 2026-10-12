const { TextDecoder, TextEncoder } = require('util');
const { webcrypto } = require('crypto');

require('@testing-library/jest-dom');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}
