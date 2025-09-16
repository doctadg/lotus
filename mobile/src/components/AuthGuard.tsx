import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  // If still loading auth state, show loading spinner
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  // If not authenticated, redirect to signup
  if (!isSignedIn) {
    return <Redirect href="/signup" />
  }

  // If authenticated, show the protected content
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  }
})
