// src/types/Card.ts
export type SectionId =
| "family" | "actions" | "food" | "drinks" | "fruits_veggies"
| "toys" | "emotions" | "character" | "professions" | "animals"
| "clothing" | "dishes" | "technology" | "transport" | "places"
| "nature" | "holiday" | "colors_shapes" | "school" | "sports"
| "numbers" | "body_parts";

export interface CardType {
  id: string;
  title: string;
  title_ru?: string;
  title_en?: string;
  title_kk?: string;
  section: SectionId;
  line: number;
  page: number;
  imageUri: string;
  thumbnailUri?: string;
  audio_kk?: string;
}