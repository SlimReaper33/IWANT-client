// components/BlockTwo.tsx

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import LocalizedText from './LocalizedText';
import { moderateScale, isTablet } from '../utils/_responsive';

// Все идентификаторы секций
export type SectionId =
  | 'family' | 'actions' | 'food' | 'drinks' | 'fruits_veggies'
  | 'toys' | 'emotions' | 'character' | 'professions' | 'animals'
  | 'clothing' | 'dishes' | 'technology' | 'transport' | 'places'
  | 'nature' | 'holiday' | 'colors_shapes' | 'school' | 'sports'
  | 'numbers' | 'body_parts';

export interface BlockTwoProps {
  selectedSection: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
}

// Конфиг секций: id, ключ локализации, цвет
export const sections: { id: SectionId; label: string; color: string }[] = [
  { id: 'family',          label: 'family',                color: '#FFD6A5' },
  { id: 'actions',         label: 'actions',               color: '#EBD0C5' },
  { id: 'food',            label: 'food',                  color: '#EBDAC5' },
  { id: 'drinks',          label: 'drinks',                color: '#EBE4C5' },
  { id: 'fruits_veggies',  label: 'fruits_and_vegetables', color: '#E8EBC5' },
  { id: 'toys',            label: 'toys',                  color: '#DDEBC5' },
  { id: 'emotions',        label: 'emotions',              color: '#D3EBC5' },
  { id: 'character',       label: 'character',             color: '#C9EBC5' },
  { id: 'professions',     label: 'professions',           color: '#C5EBCC' },
  { id: 'animals',         label: 'animals',               color: '#C5EBD7' },
  { id: 'clothing',        label: 'clothing_and_shoes',    color: '#C5EBE1' },
  { id: 'dishes',          label: 'dishes',                color: '#C5EBEB' },
  { id: 'technology',      label: 'technology',            color: '#C5E1EB' },
  { id: 'transport',       label: 'transport',             color: '#C5D7EB' },
  { id: 'places',          label: 'places',                color: '#C5CCEB' },
  { id: 'nature',          label: 'nature',                color: '#C9C5EB' },
  { id: 'holiday',         label: 'holiday',               color: '#D3C5EB' },
  { id: 'colors_shapes',   label: 'colors_and_shapes',     color: '#DDC5EB' },
  { id: 'school',          label: 'school',                color: '#E8C5EB' },
  { id: 'sports',          label: 'sports',                color: '#EBC5E4' },
  { id: 'numbers',         label: 'numbers',               color: '#EBC5DA' },
  { id: 'body_parts',      label: 'body_parts',            color: '#EBC5D0' },
];

export default function BlockTwo({
  selectedSection,
  onSectionSelect,
}: BlockTwoProps) {
  // Динамические размеры
  const containerPV = moderateScale(2);
  const btnMinW      = moderateScale(100);
  const btnPH        = moderateScale(12);
  const btnPV        = moderateScale(6);
  const textFS       = moderateScale(16);

  return (
    <View style={[styles.container, { paddingVertical: containerPV }]}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        {sections.map(sec => {
          const isActive = sec.id === selectedSection;
          return (
            <Pressable
              key={sec.id}
              onPress={() => onSectionSelect(sec.id)}
              style={[
                styles.sectionButton,
                {
                  backgroundColor: sec.color,
                  minWidth: btnMinW,
                  paddingHorizontal: btnPH,
                  paddingVertical: btnPV,
                },
                isActive && styles.activeSectionButton,
              ]}
            >
              <LocalizedText
                i18nKey={sec.label}
                style={[styles.sectionText, { fontSize: textFS }]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEE',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
  },
  sectionButton: {
    marginHorizontal: moderateScale(6),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSectionButton: {
    borderWidth: moderateScale(2),    // более заметная рамка
    borderColor: '#8C6942',
  },
  sectionText: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});
