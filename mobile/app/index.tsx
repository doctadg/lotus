import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function IndexScreen() {
  const { isSignedIn, isLoaded } = useAuth()
  
  // Show loading spinner while checking authentication
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }
  
  // Redirect to home screen if authenticated, otherwise to signup
  if (isSignedIn) {
    return <Redirect href="/home" />
  } else {
    return <Redirect href="/signup" />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  }
})
