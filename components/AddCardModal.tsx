// components/AddCardModal.tsx

import React, { FC, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import { PLACEHOLDER_IMAGE } from '../utils/config';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_MAX_W = 300;

export interface CardPayload { id: string; title: string; imageUri: string; }

export interface AddCardModalProps {
  onClose(): void;
  onAddCard(card: CardPayload, line: number): void;
}

const AddCardModalContent: FC<AddCardModalProps> = ({ onClose, onAddCard }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  const [img, setImg] = useState<string | null>(null);
  const [line, setLine] = useState<number>(1);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionsRequired'), t('permissionsDescription'));
      }
    })();
  }, [t]);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!res.canceled && res.assets.length) setImg(res.assets[0].uri);
    } catch {
      Alert.alert('Error', 'Не удалось выбрать изображение');
    }
  };

  const handleAdd = () => {
    if (!title.trim()) return Alert.alert(t('enterTitle'));
    onAddCard(
      { id: uuidv4(), title: title.trim(), imageUri: img ?? PLACEHOLDER_IMAGE },
      line
    );
    setTitle(''); setImg(null); setLine(1);
    onClose();
  };

  return (
    // вот этот контейнер прижимает всё вниз:
    <View style={styles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.wrapper}
      >
        <View style={styles.card}>
          <LocalizedText style={styles.header}>{t('addNewCardTitle')}</LocalizedText>
          <TextInput
            style={styles.input}
            placeholder={t('cardNamePlaceholder')}
            maxLength={14}
            value={title}
            onChangeText={setTitle}
          />
          <Pressable style={styles.pickBtn} onPress={pickImage}>
            <LocalizedText style={styles.pickBtnText}>
              {img ? t('changeImage') : t('pickImage')}
            </LocalizedText>
          </Pressable>
          <View style={styles.lineRow}>
            {[1,2,3].map(n => (
              <Pressable
                key={n}
                style={[styles.lineBtn, line===n && styles.lineBtnSel]}
                onPress={()=>setLine(n)}
              >
                <LocalizedText>{`${t('line')} ${n}`}</LocalizedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionAdd} onPress={handleAdd}>
              <LocalizedText style={styles.actionText}>{t('addCard')}</LocalizedText>
            </Pressable>
            <Pressable style={[styles.actionAdd, styles.cancel]} onPress={onClose}>
              <LocalizedText style={styles.actionText}>{t('cancel')}</LocalizedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddCardModalContent;

const styles = StyleSheet.create({
  
  wrapper: {
    position: 'absolute',
    top: '30%',         // отступ от низа экрана
    width: '90%',
    maxWidth: CARD_MAX_W,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: SCREEN_H * 0.8,
  },
  header: { fontSize:18, fontWeight:'bold', textAlign:'center', marginBottom:12 },
  input: {
    borderWidth:1, borderColor:'#CCC', borderRadius:6,
    paddingHorizontal:12, paddingVertical:8, marginBottom:12,
  },
  pickBtn:{ backgroundColor:'#C3947A', borderRadius:6, padding:10, alignItems:'center', marginBottom:12 },
  pickBtnText:{ color:'#fff', fontWeight:'bold' },
  lineRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:12 },
  lineBtn:{ flex:1, backgroundColor:'#EEE', borderRadius:6, padding:8, alignItems:'center', marginHorizontal:4 },
  lineBtnSel:{ backgroundColor:'#C3947A' },
  actionsRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:12 },
  actionAdd:{ flex:1, backgroundColor:'#C3947A', borderRadius:6, padding:10, alignItems:'center' },
  cancel:{ marginLeft:8, backgroundColor:'#AAA' },
  actionText:{ color:'#fff', fontWeight:'bold' },
});
