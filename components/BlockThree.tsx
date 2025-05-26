// components/BlockThree.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions
} from "react-native";
import Card from "./Card";
import { isTablet, moderateScale } from "../utils/_responsive";

interface BlockThreeCard {
  id: string;
  title: string;
  title_ru?: string;
  title_en?: string;
  title_kk?: string;
  imageUri: string;
}

interface BlockThreeProps {
  cards: BlockThreeCard[];
  onSpeak: () => void;
  onRemoveLast: () => void;
  onRemoveAll: () => void;
}

export default function BlockThree({
  cards,
  onSpeak,
  onRemoveLast,
  onRemoveAll,
}: BlockThreeProps) {
  const { width, height } = useWindowDimensions();
  const isLandscapeTablet = isTablet && width > height;
  const ICON_SIZE = moderateScale(isLandscapeTablet ? 16 : 40);
  const PAD = moderateScale(isLandscapeTablet ? 6 : 8);

  return (
    <View style={styles.container}>
      {/* Карточки */}
      <View style={styles.left}>
        <View style={[styles.line, { top: '50%' }]} />

        <ScrollView
          horizontal
          contentContainerStyle={[
            styles.cardsContainer,
            { alignItems: 'center' },
          ]}
          showsHorizontalScrollIndicator={false}
        >
          {cards.map((card, idx) => (
            <View
              key={`${card.id}-${idx}`}
              style={{ marginHorizontal: PAD / 2, marginBottom: PAD }}
            >
              <Card
                title={card.title}
                title_ru={card.title_ru}
                title_en={card.title_en}
                title_kk={card.title_kk}
                imageUri={card.imageUri}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Кнопки */}
      <View style={[styles.buttons, { width: ICON_SIZE + PAD * 2 }]}>
        {[
          { action: onSpeak,      icon: "🔊", key: "speak" },
          { action: onRemoveLast, icon: "↩️", key: "undo" },
          { action: onRemoveAll,  icon: "🗑️", key: "clear" },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#DDD",
    overflow: "hidden",
  },
  left: {
    flex: 1,
    position: "relative",
  },
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cardsContainer: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(10),
  },
  buttons: {
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
