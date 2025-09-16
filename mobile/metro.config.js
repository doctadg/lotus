const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  // Force single instance of certain modules to avoid duplicate registrations
  extraNodeModules: {
    'react-native-safe-area-context': path.resolve(
      __dirname,
      'node_modules/react-native-safe-area-context'
    ),
  },
};

module.exports = config;
