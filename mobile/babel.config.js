module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Removed deprecated 'expo-router/babel' plugin per SDK 50+ guidance
  }
}
