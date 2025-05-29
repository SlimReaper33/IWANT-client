// components/BlockThreeButtons.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { isTablet, moderateScale } from "../utils/_responsive";

interface BlockThreeButtonsProps {
  onSpeak: () => void;
  onRemoveLast: () => void;
  onRemoveAll: () => void;
}

export default function BlockThreeButtons({ onSpeak, onRemoveLast, onRemoveAll }: BlockThreeButtonsProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isLandscapeTablet = isTablet && isLandscape;

  const ICON_SIZE = moderateScale(isLandscapeTablet ? 24 : isLandscape ? 30 : 40);
  const PAD = moderateScale(isLandscapeTablet ? 6 : 8);

  return (
    <View
      style={[
        styles.buttonsContainer,
        {
          minWidth: ICON_SIZE + PAD * 2,
          maxWidth: ICON_SIZE * 3,
          flexShrink: 0,
          justifyContent: "space-around",
          paddingVertical: PAD,
        },
      ]}
    >
      {[
        { action: onSpeak, icon: "🔊", key: "speak" },
        { action: onRemoveLast, icon: "↩️", key: "undo" },
        { action: onRemoveAll, icon: "🗑️", key: "clear" },
      ].map(({ action, icon, key }) => (
        <Pressable
          key={key}
          onPress={action}
          style={[
            styles.button,
            {
              width: ICON_SIZE,
              height: ICON_SIZE,
              borderRadius: ICON_SIZE / 2,
              marginVertical: PAD / 2,
            },
          ]}
        >
          <Text style={{ fontSize: ICON_SIZE * 0.5 }}>{icon}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  button: {
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
