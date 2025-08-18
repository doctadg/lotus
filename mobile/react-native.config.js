module.exports = {
  dependencies: {
    'expo': {
      platforms: {
        android: {
          sourceDir: '../node_modules/expo/android',
          packageImportPath: 'import expo.modules.ExpoModulesPackage;'
        }
      }
    }
  },
};