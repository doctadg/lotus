import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { AuthProvider } from '../src/contexts/AuthContext'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initializeRevenueCat } from '../src/lib/revenuecat'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false)
  const [revenueCatReady, setRevenueCatReady] = React.useState(false)

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize RevenueCat first (but don't block app if it fails)
        try {
          await initializeRevenueCat()
          setRevenueCatReady(true)
        } catch (rcError) {
          console.warn('⚠️ RevenueCat initialization failed, app will continue without it:', rcError)
          setRevenueCatReady(false)
          // App will still work, just without in-app purchases
        }

        // Load fonts
        await Font.loadAsync({
          'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.otf'),
          'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.otf'),
          'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.otf'),
          'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
        })
      } catch (e) {
        console.warn('App initialization error:', e)
      } finally {
        setFontsLoaded(true)
        await SplashScreen.hideAsync()
      }
    }

    initializeApp()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {!fontsLoaded ? (
          <View style={{ flex: 1, backgroundColor: '#141414' }} />
        ) : (
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="subscription" options={{ headerShown: false }} />
            <Stack.Screen name="context" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="paywall" options={{ headerShown: false }} />
            <Stack.Screen name="pricing" options={{ headerShown: false }} />
          </Stack>
        )}
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
