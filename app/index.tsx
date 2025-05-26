// app/index.tsx

import React, { useState, useMemo, useEffect, JSX } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Platform,
} from "react-native";
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

import { customFetch } from "../utils/auth";
import {
  getCards,
  addCard as apiAddCard,
  deleteCard as apiDeleteCard,
  updateCard as apiUpdateCard,
  hideGlobalCard,
  unhideGlobalCard,
} from "../utils/cards";
import { ENDPOINTS } from "../utils/config";

export default function Index(): JSX.Element | null {
  const { i18n, t } = useTranslation();
  const { enabled: parentControlOn } = useParentControl();
  const { userToken: token, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSection, setSelectedSection] = useState<SectionId>("family");
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsInBlockThree, setCardsInBlockThree] = useState<CardType[]>([]);
  const [dropZoneY, setDropZoneY] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editParams, setEditParams] = useState<{
    line: number;
    card: CardType;
  } | null>(null);

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
          id: c.id, // use correct identifier from API
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
      }),
  });

  /** Глобальные карточки */
  const {
    data: globalCards = [],
    refetch: refetchGlobal,
  } = useQuery<CardType[], Error>({
    queryKey: ["globalCards", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await customFetch(`${ENDPOINTS.GLOBAL}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`GET global failed: ${res.status}`);
      }
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

  /** Префетчим следующую страницу личных */
  useEffect(() => {
    if (token) {
      queryClient.prefetchQuery({
        queryKey: ["cards", token, selectedSection, currentPage + 1],
        queryFn: () => getCards(token!, selectedSection, currentPage + 1),
      });
    }
  }, [token, selectedSection, currentPage, queryClient]);

  if (authLoading) return null;

  /** Собираем все карточки вместе */
  const allCards = useMemo(() => [...globalCards, ...personalCards], [
    globalCards,
    personalCards,
  ]);

  /** PageCards для BlockOne */
  const pageCards: PageCards = useMemo(() => {
    const hidden = new Set(cardsInBlockThree.map((c) => c.id));
    const avail = allCards.filter(
      (c) =>
        c.section === selectedSection &&
        c.page === currentPage &&
        !hidden.has(c.id)
    );
    return {
      line1: avail.filter((c) => c.line === 1),
      line2: avail.filter((c) => c.line === 2),
      line3: avail.filter((c) => c.line === 3),
    };
  }, [allCards, cardsInBlockThree, selectedSection, currentPage]);

  /** TTS */
  async function isLanguageSupported(lang: string) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.some(v => v.language === lang);
  } catch {
    return false;
  }
}

const speakBlockThree = async () => {
  if (!cardsInBlockThree.length) {
    const msg = t("card_not_found");
    return Speech.speak(msg, {
      language:
        i18n.language === "kk"
          ? "kk-KZ"
          : i18n.language === "ru"
          ? "ru-RU"
          : "en-US",
    });
  }

  // Проверяем заранее поддержку казахского TTS
  const canKkTTS = await isLanguageSupported("kk-KZ");

  for (const c of cardsInBlockThree) {
    // -- Казахстанская локаль --
    if (i18n.language === "kk") {
      // 1) Если TTS для казахского поддерживается и есть текст
      if (canKkTTS && c.title_kk) {
        Speech.speak(c.title_kk, { language: "kk-KZ", rate: 0.9 });
        continue;
      }

      // 2) Иначе — если есть ваша записанная дорожка, проиграть её
      if (c.audio_kk) {
        const sound = new Audio.Sound();
        try {
          await sound.loadAsync({ uri: c.audio_kk });
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if ("didJustFinish" in status && status.didJustFinish)
              sound.unloadAsync();
          });
        } catch {
          // пускай дальше fallthrough — если вдруг и этот способ не сработал
        }
        continue;
      }

      // 3) Если нет ни TTS-голоса, ни записи — читаем русский (если есть)
      if (c.title_ru) {
        Speech.speak(c.title_ru, { language: "ru-RU", rate: 0.9 });
        continue;
      }

      // 4) В крайнем случае — английский
      Speech.speak(c.title_en || c.title, {
        language: "en-US",
        rate: 0.9,
      });
      continue;
    }

    // -- Русская локаль --
    if (i18n.language === "ru") {
      Speech.speak(c.title_ru || c.title, {
        language: "ru-RU",
        rate: 0.9,
      });
      continue;
    }

    // -- Дефолт: английский --
    Speech.speak(c.title_en || c.title, {
      language: "en-US",
      rate: 0.9,
    });
  }
};


  /** Добавление */
  const handleCreate = async (card: CardType, line: number) => {
    if (parentControlOn) return Alert.alert(t("parentalControlActive"));
    const result = await apiAddCard(
      card.title,
      card.imageUri,
      selectedSection,
      line,
      currentPage,
      token!
    );
    if (result?.offline && result.card) {
      setCardsInBlockThree((prev) => [...prev, result.card]);
    }
    await refetchPersonal();
    setAddModalVisible(false);
  };

  /** Удаление */
  const handleDelete = async (line: number, card: CardType) => {
    if (parentControlOn) return Alert.alert(t("parentalControlActive"));
    await apiDeleteCard(card.id, token!);
    await refetchPersonal();
    setEditModalVisible(false);
  };

  /** Обновление */
  const handleUpdate = async (
    newTitle: string,
    _ru?: string,
    _en?: string,
    _kk?: string,
    newImg?: string,
    newAudio?: string
  ) => {
    if (!editParams || parentControlOn) return;
    const updated = await apiUpdateCard(
      editParams.card.id,
      newTitle,
      newImg,
      newAudio,
      token!
    );
    const mapped: CardType = {
      ...editParams.card,
      title: updated.title,
      imageUri: updated.imageUri,
      thumbnailUri: updated.thumbnailUri!,
      audio_kk: updated.audio_kk!,
    };
    setCardsInBlockThree((prev) =>
      prev.map((c) => (c.id === mapped.id ? mapped : c))
    );
    await refetchPersonal();
    setEditModalVisible(false);
  };

  /** Перенос в BlockThree */
  /** Перенос в BlockThree (упрощённый, с логированием) */
  const handleDrop = (line: number, card: CardType) => {
    console.log('[handleDrop] line=', line, 'card=', card);
    setCardsInBlockThree(prev => {
      console.log('[setCardsInBlockThree] предыдущее состояние:', prev);
      const next = [...prev, card];
      console.log('[setCardsInBlockThree] новое состояние:', next);
      return next;
    });
  };

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        <View
          style={{ flex: 1 }}
          pointerEvents={
            addModalVisible || editModalVisible ? "none" : "auto"
          }
        >
          <BlockOne
            backgroundColor={
              sections.find((s) => s.id === selectedSection)?.color
            }
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

        <View
          style={styles.block3}
          onLayout={(e) => setDropZoneY(e.nativeEvent.layout.y)}
        >
          <BlockThree
            cards={cardsInBlockThree}
            onSpeak={speakBlockThree}
            onRemoveLast={() =>
              setCardsInBlockThree((prev) => prev.slice(0, -1))
            }
            onRemoveAll={() => setCardsInBlockThree([])}
          />
        </View>
      </GestureHandlerRootView>

      <Portal hostName="root">
        {addModalVisible && (
          <View style={styles.portalOverlay}>
            <AddCardModal
              onClose={() => setAddModalVisible(false)}
              onAddCard={handleCreate}
            />
          </View>
        )}
        {editModalVisible && editParams && (
          <View style={styles.portalOverlay}>
            <EditCardModal
              visible
              mode="user"
              cardId={editParams.card.id}    
              onCancel={() => setEditModalVisible(false)}
              onConfirm={handleUpdate}
              onDelete={() => handleDelete(editParams.line, editParams.card)}
              currentTitle={editParams.card.title}
              currentImageUri={editParams.card.imageUri}
              currentAudioUri={editParams.card.audio_kk}
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
