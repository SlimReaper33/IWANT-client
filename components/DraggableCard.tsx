// components/DraggableCard.tsx

import React from 'react';
import { Pressable } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import Card from './Card';
import { CardType } from '../features/cards/Card';

interface DraggableCardProps {
  card: CardType;
  lineNumber: number;
  onDropCard: (lineNumber: number, card: CardType) => void;
  onPress?: () => void;
  defaultLeft: number;
  defaultTop: number;
  size: number;
  dropZoneY: number;
pointerEvents?: 'auto' | 'none';
}

export default function DraggableCard({
  card,
  lineNumber,
  onDropCard,
  onPress,
  defaultLeft = 0,
  defaultTop = 0,
  size,
  dropZoneY,
 pointerEvents = 'auto',
}: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      isDragging.value = true;
    },
    onActive: event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: event => {
      isDragging.value = false;
      const dropped = event.absoluteY > dropZoneY;
      if (dropped) {
        runOnJS(onDropCard)(lineNumber, card);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const baseStyle = {
    position: 'absolute' as const,
    left: defaultLeft,
    top: defaultTop,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: isDragging.value ? 1000 : 1,
    elevation: isDragging.value ? 1000 : 1,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
pointerEvents={pointerEvents}
        style={[baseStyle, animatedStyle]}
      >
        <Pressable onPress={onPress}>
          <Card {...card} size={size} />
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
}
