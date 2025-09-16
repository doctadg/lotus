import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/contexts/AuthContext'
import { SubscriptionProvider } from './src/contexts/SubscriptionContext'
import { useAuth } from './src/hooks/useAuth'

// Import screens compatible with React Navigation
import { LoginScreen, RegisterScreen } from './src/screens/AuthScreens'
import { 
  HomeScreen, 
  MemoriesScreen, 
  ProfileScreen, 
  SettingsScreen, 
  ContextScreen 
} from './src/screens/AppScreens'

const Stack = createStackNavigator()

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#000' }
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Memories" component={MemoriesScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Context" component={ContextScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AppNavigator />
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
