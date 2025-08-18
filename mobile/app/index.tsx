import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../src/hooks/useAuth'

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }
  
  // Redirect to home screen if authenticated, otherwise to signup
  if (isAuthenticated) {
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
