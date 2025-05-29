// components/BlockOne.tsx

import React, { useState } from "react";
import { View, Pressable, LayoutChangeEvent, Alert } from "react-native";
import LocalizedText from "./LocalizedText";
import DraggableCard from "./DraggableCard";
import { CardType } from "../features/cards/Card";
import styles from "../styles/BlockOne.styles";
import { useTranslation } from "react-i18next";
import { useParentControl } from "../features/auth/ParentControlContext";
import { moderateScale } from "../utils/_responsive";

export type PageCards = {
  line1: CardType[];
  line2: CardType[];
  line3: CardType[];
};

export interface BlockOneProps {
  backgroundColor?: string;
  pageCards: PageCards;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDropCard: (line: number, card: CardType) => void;
  onAddPress: () => void;
  onEditPress: (line: number, card: CardType) => void;
  onDeleteCard: (line: number, card: CardType) => Promise<void>;
  onOpenMenu: () => void;
  dropZoneY: number;
  /** Флаг, показывающий, открыта ли модалка */
  isModalOpen: boolean;
}

export default function BlockOne({
  backgroundColor = "#C3947A",
  pageCards,
  currentPage,
  onPageChange,
  onDropCard,
  onAddPress,
  onEditPress,
  onOpenMenu,
  dropZoneY,
  isModalOpen,
}: BlockOneProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation();
  const { enabled: parentControlOn } = useParentControl();

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const lineY = (n: 1 | 2 | 3) =>
    (containerSize.height * ((2 * (n - 1) + 1)) / 6);

  const CARD_SIZE = Math.max(
    60,
    Math.min(
      Math.min(containerSize.width, containerSize.height) * 0.2,
      140
    )
  );

  const getCardPosition = (
    line: number,
    index: number,
    total: number
  ): { left: number; top: number } => {
    const { width, height } = containerSize;
    if (!width || !height) return { left: 0, top: 0 };
    const y = lineY(line as 1 | 2 | 3);
    if (width > height) {
      const x = (width / (total + 1)) * (index + 1);
      return { left: x - CARD_SIZE / 2, top: y - CARD_SIZE / 2 };
    } else {
      const x = lineY(line as 1 | 2 | 3) * (width / height);
      const cy = (height / (total + 1)) * (index + 1);
      return { left: x - CARD_SIZE / 2, top: cy - CARD_SIZE / 2 };
    }
  };

  const handleCardPress = (line: number, card: CardType) => {
    if (!isEditing) return;
    if (parentControlOn) {
      Alert.alert(t("parentalControlActive"));
      return;
    }
    onEditPress(line, card);
  };

  return (
    <View
      style={[styles.blockOneContainer, { backgroundColor }]}
      pointerEvents={isModalOpen ? "none" : "auto"}
      onLayout={onLayout}
    >
      {/* Линии */}
      {containerSize.width > containerSize.height ? (
        <View style={styles.horizontalLinesContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.horizontalLineRow}>
              <View style={styles.actualLineHorizontal} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.verticalLinesContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.verticalLineColumn}>
              <View style={styles.actualLineVertical} />
            </View>
          ))}
        </View>
      )}
      
      {/* Карточки */}
      {(["line1", "line2", "line3"] as const).map((key, idx) =>
       pageCards[key].map((card, i) => {
          const pos = getCardPosition(idx + 1, i, pageCards[key].length);
          const keyId = `${idx + 1}-${card.id}-${i}`;
          return (
            <DraggableCard
            key={keyId}
            pointerEvents={isModalOpen ? "none" : "auto"}
            card={card}
            lineNumber={idx+1}
            defaultLeft={pos.left}
            defaultTop={pos.top}
            size={CARD_SIZE}
            dropZoneY={dropZoneY}
            onDropCard={onDropCard}
            onPress={() => handleCardPress(idx+1, card)}
            />
            );
        })
      )}

      {/* Шестерёнка */}
      <View
        style={styles.headerContainer}
        pointerEvents={isModalOpen ? "none" : "auto"}
      >
        <Pressable onPress={onOpenMenu}>
          <LocalizedText style={styles.gearIcon}>⚙️</LocalizedText>
        </Pressable>
      </View>

      {/* UI футера */}
      <View
        style={styles.uiContainer}
        pointerEvents={isModalOpen ? "none" : "auto"}
      >
        <LocalizedText style={styles.pageLabelBottomLeft}>
          {t("pageInfo", { current: currentPage, total: 5 })}
        </LocalizedText>
        <View
          style={styles.bottomRightButtonsContainer}
          pointerEvents={isModalOpen ? "none" : "auto"}
        >
          <Pressable
            style={styles.roundButton}
            onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            <LocalizedText style={styles.buttonIcon}>⬆</LocalizedText>
          </Pressable>
          <Pressable
            style={[styles.roundButton, { marginLeft: moderateScale(12) }]}
            onPress={() => onPageChange(Math.min(5, currentPage + 1))}
          >
            <LocalizedText style={styles.buttonIcon}>⬇</LocalizedText>
          </Pressable>
          <Pressable
            style={[
              styles.roundButton,
              isEditing && styles.inactiveButton,
              { marginLeft: moderateScale(12) },
            ]}
            onPress={() => setIsEditing((e) => !e)}
          >
            <LocalizedText style={styles.buttonIcon}>✏️</LocalizedText>
          </Pressable>
        </View>
        {isEditing && (
          <View
            style={styles.editButtonsContainer}
            pointerEvents={isModalOpen ? "none" : "auto"}
          >
            <Pressable style={styles.roundButtonPlus} onPress={onAddPress}>
              <LocalizedText style={styles.buttonIcon}>＋</LocalizedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
