// components/BlockThree.tsx

import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions
} from "react-native";
import Card from "./Card";
import { isTablet, moderateScale } from "../utils/_responsive";
import BlockThreeButtons from "./BlockThreeButtons";

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
      <BlockThreeButtons
        onSpeak={onSpeak}
        onRemoveLast={onRemoveLast}
        onRemoveAll={onRemoveAll}
      />
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
});
