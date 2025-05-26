// components/LocalizedText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

interface LocalizedTextProps extends TextProps {
  /** Ключ перевода */
  i18nKey?: string;
  /** Важно: если вы передали i18nKey, children игнорируется */
  children?: string;
}

export default function LocalizedText({
  i18nKey,
  children,
  ...rest
}: LocalizedTextProps) {
  const { t } = useTranslation();
  const key = i18nKey ?? (typeof children === 'string' ? children : '');
  return <Text {...rest}>{t(key)}</Text>;
}
