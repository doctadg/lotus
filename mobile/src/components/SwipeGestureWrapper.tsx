import React, { useRef } from 'react'
import { View } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

interface SwipeGestureWrapperProps {
  children: React.ReactNode
  onSwipeToOpen: () => void
  onSwipeToClose: () => void
  sidebarOpen: boolean
}

export default function SwipeGestureWrapper({
  children,
  onSwipeToOpen,
  onSwipeToClose,
  sidebarOpen
}: SwipeGestureWrapperProps) {
  const startX = useRef(0)
  const currentX = useRef(0)

  const onGestureEvent = (event: any) => {
    currentX.current = event.nativeEvent.translationX
  }

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent
      
      // Swipe to open: when sidebar is closed, swipe right from anywhere
      if (!sidebarOpen && translationX > 50) {
        onSwipeToOpen()
      }
      // Swipe to close: when sidebar is open, swipe left from anywhere (more sensitive)
      else if (sidebarOpen && (translationX < -30 || velocityX < -300)) {
        onSwipeToClose()
      }
    }
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </PanGestureHandler>
  )
}