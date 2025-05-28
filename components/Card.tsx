import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { UPLOADS_URL, PLACEHOLDER_IMAGE } from "../utils/config";

export type CardProps = {
  title:         string;
  title_ru?:     string;
  title_en?:     string;
  title_kk?:     string;
  imageUri:      string;
  thumbnailUri?: string;
  size?:         number;
};

export default function Card({
  title,
  title_ru,
  title_en,
  title_kk,
  imageUri,
  thumbnailUri,
  size = 80,
}: CardProps) {
  const { i18n } = useTranslation();

  // Выбираем заголовок в зависимости от языка
  const displayTitle = useMemo(() => {
    if (i18n.language === "ru" && title_ru) return title_ru;
    if (i18n.language === "en" && title_en) return title_en;
    if (i18n.language === "kk" && title_kk) return title_kk;
    return title;
  }, [i18n.language, title, title_ru, title_en, title_kk]);

  // Составляем корректный URL картинки
  const uri = useMemo(() => {
    const pick = thumbnailUri ?? imageUri;
    // Если это полноценный URL (http/https) или локальный файл, возвращаем без изменений
    if (pick.startsWith("http") || pick.startsWith("file://")) {
      return pick;
    }
    // относительный путь
    return UPLOADS_URL + (pick.startsWith("/") ? pick : "/" + pick);
  }, [thumbnailUri, imageUri]);

  const containerSize = size;
  const imageSize     = size * 0.75;
  const titleFontSize = Math.max(10, size * 0.15);

  return (
    <View style={[styles.card, { width: containerSize, height: containerSize }]}>
      <Text
        style={[styles.title, { fontSize: titleFontSize }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayTitle}
      </Text>
      <Image
        source={{ uri }}
        style={[styles.image, { width: imageSize, height: imageSize }]}
        resizeMode="cover"
        onError={() => {
          /* при необходимости можно установить PLACEHOLDER_IMAGE: */
          /* source={{ uri: PLACEHOLDER_IMAGE }} */
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    marginTop: 2,
    marginBottom: 2,
    fontWeight: "bold",
    textAlign: "center",
  },
  image: {
    borderRadius: 6,
  },
});
