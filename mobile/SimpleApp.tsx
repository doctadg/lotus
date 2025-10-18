import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function SimpleApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mror Mobile</Text>
      <Text style={styles.subtitle}>App is working!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ababab',
    fontSize: 16,
  },
})