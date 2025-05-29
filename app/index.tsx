// File: client/app/index.tsx

import React, { useState, useMemo, useEffect, JSX } from "react";
import { Alert, StyleSheet, View, Platform, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "@gorhom/portal";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../features/auth/AuthContext";
import { useParentControl } from "../features/auth/ParentControlContext";
import { CardType, SectionId } from "../features/cards/Card";
import BlockOne, { PageCards } from "../components/BlockOne";
import BlockTwo, { sections } from "../components/BlockTwo";
import BlockThree from "../components/BlockThree";
import AddCardModal from "../components/AddCardModal";
import EditCardModal from "../components/EditCardModal";
import GearMenu from "../components/GearMenu";

import { useLocalAssets } from "../hooks/useLocalAssets";

import { customFetch } from "../utils/auth";
import {
  getCards,
  addCard as apiAddCard,
  deleteCard as apiDeleteCard,
  updateCard as apiUpdateCard,
} from "../utils/cards";
import { ENDPOINTS } from "../utils/config";

export default function Index(): JSX.Element | null {
  const { i18n, t } = useTranslation();
  const { enabled: parentControlOn } = useParentControl();
  const { userToken: token, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Единый хук для локальных картинок и аудио
  const { map: localAssets, setLocalImage, setLocalAudio } = useLocalAssets();

  const [selectedSection, setSelectedSection] = useState<SectionId>("family");
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsInBlockThree, setCardsInBlockThree] = useState<CardType[]>([]);
  const [dropZoneY, setDropZoneY] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editParams, setEditParams] = useState<{ line: number; card: CardType } | null>(null);

  const fmt = (u: string) => encodeURI(u);

  /** Личные карточки */
  const {
    data: personalCards = [],
    refetch: refetchPersonal,
  } = useQuery<CardType[], Error>({
    queryKey: ["cards", token, selectedSection, currentPage],
    queryFn: () => getCards(token!, selectedSection, currentPage),
    enabled: !!token,
    select: (apiCards) =>
      apiCards.map((c) => {
        const rawImg = c.imageUri.startsWith("http")
          ? c.imageUri
          : `${ENDPOINTS.BASE}${c.imageUri}`;
        const rawThumb = c.thumbnailUri
          ? c.thumbnailUri.startsWith("http")
            ? c.thumbnailUri
            : `${ENDPOINTS.BASE}${c.thumbnailUri}`
          : rawImg;
        return {
          ...c,
          imageUri: fmt(rawImg),
          thumbnailUri: fmt(rawThumb),
          audio_kk: c.audio_kk || "",
        };
      }),
  });

  /** Глобальные карточки */
  const { data: globalCards = [] } = useQuery<CardType[], Error>({
    queryKey: ["globalCards", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await customFetch(`${ENDPOINTS.GLOBAL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`GET global failed: ${res.status}`);
      const { cards } = await res.json();
      return cards.map((c: any) => {
        const rawImg = c.imageUri;
        const rawThumb = c.thumbnailUri
          ? c.thumbnailUri.startsWith("http")
            ? c.thumbnailUri
            : `${ENDPOINTS.BASE}${c.thumbnailUri}`
          : rawImg;
        return {
          id: c.id ?? c._id,
          title: c.title,
          title_ru: c.title_ru,
          title_en: c.title_en,
          title_kk: c.title_kk,
          section: c.section,
          line: c.line,
          page: c.page,
          imageUri: fmt(rawImg),
          thumbnailUri: fmt(rawThumb),
          audio_kk: c.audio_kk || "",
        };
      });
    },
  });

  useEffect(() => {
    setCardsInBlockThree((prev) =>
      prev.map((c) => ({
        ...c,
        audio_kk: localAssets[c.id]?.audio ?? c.audio_kk,
      }))
    );
  }, [localAssets]);

  // Прелоадим превьюшки глобальных карт
  useEffect(() => {
    globalCards.forEach((c) => {
      if (c.thumbnailUri) {
        Image.prefetch(c.thumbnailUri);
      }
    });
  }, [globalCards]);

  if (authLoading) return null;

  /** Собираем всё вместе с локальными оверрайдами */
  const allCards = useMemo(() => {
    return [...globalCards, ...personalCards].map((c) => {
      const entry = localAssets[c.id] || {};
      return {
        ...c,
        imageUri: entry.image ?? c.imageUri,
        thumbnailUri: entry.image ?? c.thumbnailUri ?? c.imageUri,
        audio_kk: entry.audio ?? c.audio_kk,
      };
    });
  }, [globalCards, personalCards, localAssets]);

  /** PageCards для BlockOne */
  const pageCards: PageCards = useMemo(() => {
    const hidden = new Set(cardsInBlockThree.map((c) => c.id));

    const avail = allCards.filter(
      (c) => c.section === selectedSection && c.page === currentPage && !hidden.has(c.id)
    );
    return {
      line1: avail.filter((c) => c.line === 1),
      line2: avail.filter((c) => c.line === 2),
      line3: avail.filter((c) => c.line === 3),
    };
  }, [allCards, cardsInBlockThree, selectedSection, currentPage]);

  /** Последовательное воспроизведение аудио/TTS */
  const speakBlockThree = async () => {
    if (!cardsInBlockThree.length) {
      const msg = t("card_not_found");
      await new Promise<void>((resolve) => {
        Speech.speak(msg, { language: "ru-RU", onDone: () => resolve(), onError: () => resolve() });
      });
      return;
    }
    for (const c of cardsInBlockThree) {
      if (i18n.language === "kk" && c.audio_kk) {
        // Проигрываем локальное аудио на казахском
        const sound = new Audio.Sound();
        try {
          await sound.loadAsync({ uri: c.audio_kk });
          await sound.playAsync();
          await new Promise<void>((resolve) => {
            sound.setOnPlaybackStatusUpdate((status) => {
              if ("didJustFinish" in status && status.didJustFinish) {
                sound.unloadAsync();
                resolve();
              }
            });
          });
        } catch {
          // Если ошибка — fallback на TTS казахский
          const msg = c.title_kk || c.title;
          await new Promise<void>((resolve) => {
            Speech.speak(msg, { language: "kk-KZ", onDone: () => resolve(), onError: () => resolve() });
          });
        }
      } else if (i18n.language === "kk" && !c.audio_kk) {
        // Казахский язык, но нет аудио — читаем title_kk русским голосом
        const msg = c.title_kk || c.title;
        await new Promise<void>((resolve) => {
          Speech.speak(msg, { language: "ru-RU", rate: 0.9, onDone: () => resolve(), onError: () => resolve() });
        });
      } else {
        // Остальные языки (ru, en)
        let lang = "ru-RU";
        let text = c.title_ru || c.title;

        if (i18n.language === "en") {
          lang = "en-US";
          text = c.title_en || c.title;
        } else if (i18n.language === "ru") {
          lang = "ru-RU";
          text = c.title_ru || c.title;
        }

        await new Promise<void>((resolve) => {
          Speech.speak(text, { language: lang, rate: 0.9, onDone: () => resolve(), onError: () => resolve() });
        });
      }
    }
  };

  /** CRUD */
  const handleCreate = async (card: CardType, line: number) => {
  if (parentControlOn) return Alert.alert(t("parentalControlActive"));

  // Используем pageCards из useMemo, который уже содержит фильтрацию по currentPage и selectedSection
  const cardsInLine = [
    ...pageCards.line1,
    ...pageCards.line2,
    ...pageCards.line3,
  ].filter(c => c.line === line);

  if (cardsInLine.length >= 5) {
    return Alert.alert(
      t("maxCardsLimitReached"),
      t("max5CardsAllowedPerLine") // "Максимум 5 карт в одной линии"
    );
  }

  const result = await apiAddCard(card.title, card.imageUri, selectedSection, line, currentPage, token!);

  if (result?.offline && result.card) {
    setCardsInBlockThree((p) => [...p, result.card]);
  }

  await refetchPersonal();
  setAddModalVisible(false);
};
  const handleDelete = async (line: number, card: CardType) => {
    if (parentControlOn) return Alert.alert(t("parentalControlActive"));
    await apiDeleteCard(card.id, token!);
    await refetchPersonal();
    setEditModalVisible(false);
  };
  const handleUpdate = async (
    newTitle: string,
    _ru?: string,
    _en?: string,
    _kk?: string,
    newImg?: string,
    newAudio?: string
  ) => {
    if (!editParams || parentControlOn) return;

    const updatedCard = (await apiUpdateCard(
      editParams.card.id,
      newTitle,
      newImg,
      newAudio,
      token!
    )) as CardType;

    setCardsInBlockThree((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );

    await refetchPersonal();
    setEditModalVisible(false);
  };

  const handleDrop = (line: number, card: CardType, onReject?: () => void) => {
  if (cardsInBlockThree.length >= 10) {
    Alert.alert(t("maxCardsLimitReached"), t("max10CardsAllowed"));
    // Если есть callback на отклонение, вызываем его — чтобы карта вернулась на место
    if (onReject) onReject();
    return;
  }
  setCardsInBlockThree((prev) => [...prev, card]);
};

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        <View style={{ flex: 1 }} pointerEvents={addModalVisible || editModalVisible ? "none" : "auto"}>
          <BlockOne
            backgroundColor={sections.find((s) => s.id === selectedSection)?.color}
            pageCards={pageCards}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onDropCard={handleDrop}
            onAddPress={() => setAddModalVisible(true)}
            onEditPress={(ln, card) => {
              setEditParams({ line: ln, card });
              setEditModalVisible(true);
            }}
            onDeleteCard={handleDelete}
            onOpenMenu={() => setMenuVisible(true)}
            dropZoneY={dropZoneY}
            isModalOpen={addModalVisible || editModalVisible}
          />
        </View>

        <View style={styles.block2}>
          <BlockTwo
            selectedSection={selectedSection}
            onSectionSelect={(sec) => {
              setSelectedSection(sec);
              setCurrentPage(1);
            }}
          />
        </View>

        <View style={styles.block3} onLayout={(e) => setDropZoneY(e.nativeEvent.layout.y)}>
          <BlockThree
            cards={cardsInBlockThree.map((c) => ({
              ...c,
              audio_kk: localAssets[c.id]?.audio ?? c.audio_kk,
            }))}
            onSpeak={speakBlockThree}
            onRemoveLast={() => setCardsInBlockThree((p) => p.slice(0, -1))}
            onRemoveAll={() => setCardsInBlockThree([])}
          />
        </View>
      </GestureHandlerRootView>

      <Portal hostName="root">
        {addModalVisible && (
          <View style={styles.portalOverlay}>
            <AddCardModal onClose={() => setAddModalVisible(false)} onAddCard={handleCreate} />
          </View>
        )}
        {editModalVisible && editParams && (
          <View style={styles.portalOverlay}>
            <EditCardModal
              mode={personalCards.some((c) => c.id === editParams.card.id) ? "admin" : "user"}
              visible={editModalVisible}
              cardId={editParams.card.id}
              currentTitle={editParams.card.title}
              currentTitleRu={editParams.card.title_ru}
              currentTitleEn={editParams.card.title_en}
              currentTitleKk={editParams.card.title_kk}
              currentImageUri={editParams.card.imageUri}
              currentAudioUri={editParams.card.audio_kk}
              setLocalImage={setLocalImage}
              setLocalAudio={setLocalAudio}
              map={localAssets}
              onConfirm={handleUpdate}
              onDelete={() => handleDelete(editParams.line, editParams.card)}
              onCancel={() => setEditModalVisible(false)}
              isGlobal={globalCards.some(c => c.id === editParams.card.id)}
            />
          </View>
        )}
        {menuVisible && (
          <View style={styles.portalOverlay}>
            <GearMenu onClose={() => setMenuVisible(false)} />
          </View>
        )}
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DDD" },
  block2: { height: "10%" },
  block3: { height: "20%" },
  portalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    justifyContent: "flex-end",
    paddingBottom: 20,
    alignItems: "center",
    zIndex: 9999,
  },
});
