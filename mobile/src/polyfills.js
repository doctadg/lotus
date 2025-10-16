// Polyfills for Hermes compatibility
import 'react-native-get-random-values'

// Polyfill for global.Buffer if needed by dependencies
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer
}

// Polyfill for global.process if needed
if (typeof global.process === 'undefined') {
  global.process = require('process')
}

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Ensure crypto is available for uuid and other crypto operations
// if (typeof global.crypto === 'undefined') {
//   const crypto = require('crypto')
//   global.crypto = crypto
//   global.crypto.getRandomValues = crypto.getRandomValues || crypto.randomFillSync
// }