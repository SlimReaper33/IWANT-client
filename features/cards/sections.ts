// src/constants/sections.ts

// Конфигурация секций: id, ключ для перевода (label) и цвет кнопки
export const SECTION_CONFIG = [
    { id: 'family', label: 'family', color: '#FF9AA2' },
    { id: 'actions', label: 'actions', color: '#FFB7B2' },
    { id: 'food', label: 'food', color: '#FFDAC1' },
    { id: 'drinks', label: 'drinks', color: '#FF9AA2' },
    { id: 'fruits_veggies', label: 'fruits_and_vegetables', color: '#FFB7B2' },
    { id: 'toys', label: 'toys', color: '#FFDAC1' },
    { id: 'emotions', label: 'emotions', color: '#FF9AA2' },
    { id: 'character', label: 'character', color: '#FFB7B2' },
    { id: 'professions', label: 'professions', color: '#FFDAC1' },
    { id: 'animals', label: 'animals', color: '#FF9AA2' },
    { id: 'clothing', label: 'clothing_and_shoes', color: '#FFB7B2' },
    { id: 'dishes', label: 'dishes', color: '#FFDAC1' },
    { id: 'technology', label: 'technology', color: '#FF9AA2' },
    { id: 'transport', label: 'transport', color: '#FFB7B2' },
    { id: 'places', label: 'places', color: '#FFDAC1' },
    { id: 'nature', label: 'nature', color: '#FF9AA2' },
    { id: 'holiday', label: 'holiday', color: '#FFB7B2' },
    { id: 'colors_shapes', label: 'colors_and_shapes', color: '#FFDAC1' },
    { id: 'school', label: 'school', color: '#FF9AA2' },
    { id: 'sports', label: 'sports', color: '#FFB7B2' },
    { id: 'numbers', label: 'numbers', color: '#FFDAC1' },
    { id: 'body_parts', label: 'body_parts', color: '#FF9AA2' },
  ] as const;
  
  // Типичная строка: { id: string; label: string; color: string }
  export type SectionConfig = typeof SECTION_CONFIG[number];
  
  // Удобный тип для id
  export type SectionId = SectionConfig['id'];
  