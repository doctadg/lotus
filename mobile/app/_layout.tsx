import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/contexts/AuthContext'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { View } from 'react-native'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false)

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.otf'),
          'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.otf'),
          'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.otf'),
          'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
        })
      } catch (e) {
        console.warn(e)
      } finally {
        setFontsLoaded(true)
        await SplashScreen.hideAsync()
      }
    }

    loadFonts()
  }, [])

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#141414' }} />
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="memories" options={{ headerShown: false }} />
          <Stack.Screen name="memory/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          <Stack.Screen name="context" options={{ headerShown: false }} />
          <Stack.Screen name="questions" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
