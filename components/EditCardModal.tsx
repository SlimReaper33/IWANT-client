import React, { FC, useEffect, useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import { useKazakhRecorder } from '../hooks/useKazakhRecoreder';
import * as FileSystem from 'expo-file-system';
import { useLocalAssets } from '../hooks/useLocalAssets';
import { useLocalAudio } from '../hooks/useLocalAudio';

const CARD_MAX_W = 340;

export interface EditCardModalProps {
  mode: 'user' | 'admin';
  visible: boolean;
  cardId: string;
  currentTitle: string;
  currentTitleRu?: string;
  currentTitleEn?: string;
  currentTitleKk?: string;
  currentImageUri?: string;
  currentThumbnailUri?: string;
  currentAudioUri?: string;
  setLocalImage(cardId: string, uri: string): Promise<void>;
  setLocalAudio?(cardId: string, uri: string): Promise<void>;
  map: Record<string, { image?: string; audio?: string }>;
  onConfirm(
    newTitle: string,
    newTitleRu?: string,
    newTitleEn?: string,
    newTitleKk?: string,
    newImageUri?: string,
    newAudioUri?: string
  ): Promise<void>;
  onCancel(): void;
  onDelete?(): void;
}

const EditCardModal: FC<EditCardModalProps> = ({
  mode,
  visible,
  cardId,
  currentTitle,
  currentTitleRu = '',
  currentTitleEn = '',
  currentTitleKk = '',
  currentImageUri,
  currentThumbnailUri,
  currentAudioUri,
  onConfirm,
  onCancel,
  onDelete,
  setLocalImage,
  setLocalAudio,
  map,
}) => {
  const { t } = useTranslation();
  // Приводим хук к верному типу, чтобы uri был string | null
  const recorder = useKazakhRecorder() as {
    recording: boolean;
    uri: string | null;
    start: () => void;
    stop: () => void;
    play: (uri: string) => void;
  };
  const { recording, uri: recordedUriRaw, start, stop, play } = recorder;
  const recordedUri = recordedUriRaw ?? undefined;

  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { map: localEntry } = useLocalAssets();
  const { map: localAudioMap, setLocal: setAudioLocal } = useLocalAudio();

  const [title, setTitle] = useState(currentTitle);
  const [titleRu, setTitleRu] = useState(currentTitleRu);
  const [titleEn, setTitleEn] = useState(currentTitleEn);
  const [titleKk, setTitleKk] = useState(currentTitleKk);
  const [imageUri, setImageUri] = useState<string | undefined>(currentImageUri);
  const [audioUri, setAudioUri] = useState<string | undefined>(currentAudioUri);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(currentTitle);
      setTitleRu(currentTitleRu);
      setTitleEn(currentTitleEn);
      setTitleKk(currentTitleKk);
      setImageUri(currentImageUri);
      setAudioUri(currentAudioUri);
      setPreviewLoading(false);
      setConfirmingDelete(false);
      setSaving(false);
    }
  }, [visible]);

  const localImg = localEntry[cardId]?.image;
  const localAud = localAudioMap[cardId];
  // Используем миниатюру для быстрой загрузки, fallback на полное изображение
  const thumbUri = localImg ?? currentThumbnailUri ?? currentImageUri;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permission_error'), t('permission_error_desc'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      if (mode === 'user') {
        const ext = uri.substring(uri.lastIndexOf('.'));
        const dest = `${FileSystem.documentDirectory}image_${cardId}${ext}`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        await setLocalImage(cardId, dest);
        setImageUri(dest);
        return;
      }
      setImageUri(uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('enterTitleError'));
      return;
    }
    setSaving(true);
    try {
      let finalImage = imageUri;
      let finalAudio: string | undefined;

      if (recordedUri && typeof recordedUri === 'string') {
        const ext = recordedUri.includes('.')
          ? recordedUri.substring(recordedUri.lastIndexOf('.'))
          : '.m4a';
        const dest = `${FileSystem.documentDirectory}audio_${cardId}${ext}`;
        await FileSystem.copyAsync({ from: recordedUri, to: dest });
        if (mode === 'user' && setAudioLocal) {
          await setAudioLocal(cardId, dest);
          onCancel();
          setSaving(false);
          return;
        }
        finalAudio = dest;
      }

      const ru = mode === 'admin' ? titleRu.trim() || undefined : undefined;
      const en = mode === 'admin' ? titleEn.trim() || undefined : undefined;
      const kk = mode === 'admin' ? titleKk.trim() || undefined : undefined;

      await onConfirm(title.trim(), ru, en, kk, finalImage, finalAudio);
      onCancel();
    } catch (err) {
      console.error(err);
      Alert.alert(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const wrapperWidth = Math.min(SCREEN_W * 0.9, CARD_MAX_W);
  const wrapperMaxHeight = SCREEN_H * 0.9;
  const previewSize = wrapperWidth * 0.6;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
          style={[styles.wrapper, { width: wrapperWidth, maxHeight: wrapperMaxHeight }]}
        >
          <ScrollView contentContainerStyle={styles.container}>
            {!confirmingDelete ? (
              <>
                <LocalizedText style={styles.header}>
                  {mode === 'admin' ? t('editCardAdminTitle') : t('editCardTitle')}
                </LocalizedText>

                {mode === 'admin' && (
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('cardNamePlaceholder')}
                  />
                )}

                <Pressable style={styles.imageButton} onPress={pickImage} disabled={saving}>
                  <LocalizedText style={styles.imageButtonText}>{t('changeImage')}</LocalizedText>
                </Pressable>

                {thumbUri && (
                  <View>
                    {previewLoading && (
                      <ActivityIndicator
                        style={[styles.preview, { position: 'absolute', top: 0, left: 0 }]}
                      />
                    )}
                    <Image
                      source={{ uri: thumbUri }}
                      style={[styles.preview, { width: previewSize, height: previewSize }]}
                      onLoadStart={() => setPreviewLoading(true)}
                      onLoadEnd={() => setPreviewLoading(false)}
                    />
                  </View>
                )}

                <Pressable
                  style={[styles.audioButton, recording && styles.recording]}
                  onPress={recording ? stop : start}
                  disabled={saving}
                >
                  <LocalizedText style={styles.audioButtonText}>
                    {recording
                      ? t('stopKazakhRecording')
                      : recordedUri || audioUri || localAud
                      ? t('reRecordKazakh')
                      : t('recordKazakh')}
                  </LocalizedText>
                </Pressable>

                {(recordedUri || audioUri || localAud) && (
                  <Pressable
                    style={styles.audioButton}
                    onPress={() => play(recordedUri || audioUri || localAud!)}
                    disabled={saving}
                  >
                    <LocalizedText style={styles.audioButtonText}>
                      {t('playKazakh')}
                    </LocalizedText>
                  </Pressable>
                )}

                <View style={styles.buttonsRow}>
                  <Pressable style={styles.btn} onPress={handleSave} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <LocalizedText style={styles.btnText}>{t('save')}</LocalizedText>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.cancelBtn]}
                    onPress={onCancel}
                    disabled={saving}
                  >
                    <LocalizedText style={styles.btnText}>{t('cancel')}</LocalizedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <LocalizedText style={styles.header}>{t('areYouSureDelete')}</LocalizedText>
                <View style={styles.buttonsRow}>
                  <Pressable
                    style={styles.btn}
                    onPress={() => setConfirmingDelete(false)}
                    disabled={saving}
                  >
                    <LocalizedText style={styles.btnText}>{t('cancel')}</LocalizedText>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.deleteBtn]}
                    onPress={() => {
                      onDelete?.();
                      setConfirmingDelete(false);
                    }}
                    disabled={saving}
                  >
                    <LocalizedText style={styles.btnText}>{t('deleteCard')}</LocalizedText>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default EditCardModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: { backgroundColor: '#FFF', borderRadius: 8, padding: 0 },
  container: { padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  preview: { borderRadius: 6, alignSelf: 'center', marginBottom: 12 },
  imageButton: {
    backgroundColor: '#EEE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  imageButtonText: { fontWeight: 'bold' },
  audioButton: {
    backgroundColor: '#D0F0C0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  recording: { backgroundColor: '#F08080' },
  audioButtonText: { fontWeight: 'bold' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#C3947A',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelBtn: { backgroundColor: '#AAA' },
  deleteBtn: { backgroundColor: '#D9534F' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});
