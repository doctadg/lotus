import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate
} from 'react-native-reanimated'

export const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0)
  const dot2 = useSharedValue(0)
  const dot3 = useSharedValue(0)

  useEffect(() => {
    const startAnimation = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    }

    setTimeout(() => startAnimation(dot1, 0), 0)
    setTimeout(() => startAnimation(dot2, 200), 200)
    setTimeout(() => startAnimation(dot3, 400), 400)

    return () => {
      dot1.value = 0
      dot2.value = 0
      dot3.value = 0
    }
  }, [])

  const createDotStyle = (progress: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(progress.value, [0, 1], [0.3, 1]),
      transform: [{
        scale: interpolate(progress.value, [0, 1], [0.8, 1.2])
      }]
    }))

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <View style={styles.avatarText} />
        </View>
      </View>
      
      <View style={styles.messageContainer}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, createDotStyle(dot1)]} />
          <Animated.View style={[styles.dot, createDotStyle(dot2)]} />
          <Animated.View style={[styles.dot, createDotStyle(dot3)]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  avatarContainer: {
    marginHorizontal: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10a37f',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white'
  },
  messageContainer: {
    backgroundColor: '#f7f7f8',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 16,
    marginRight: 60
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2
  }
})