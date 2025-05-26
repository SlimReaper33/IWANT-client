// app/utils/responsive.ts
export default null;
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 360;          // ширина вашего «базового» дизайна
export const scale = SCREEN_WIDTH / BASE_WIDTH;
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Жёсткое масштабирование (normalize):
 * size * (SCREEN_WIDTH / BASE_WIDTH)
 */
export function normalize(size: number) {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Умеренное масштабирование:
 * size + (normalize(size) - size) * factor
 * где factor = 0 — не масштабировать совсем,
 * factor = 1 — использовать полное normalize(size).
 * Обычно 0.3–0.5 даёт вполне аккуратный результат.
 */
export function moderateScale(size: number, factor = 0.4) {
  const normalizedSize = normalize(size);
  return Math.round(size + (normalizedSize - size) * factor);
}
