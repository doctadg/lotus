// Import polyfills first to ensure Hermes compatibility
import './src/polyfills'

import { AppRegistry } from 'react-native'
import { ExpoRoot } from 'expo-router'

// Must be exported or React Native will throw an error
export default function App() {
  const ctx = require.context('./app')
  return <ExpoRoot context={ctx} />
}

AppRegistry.registerComponent('main', () => App)
