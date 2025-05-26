// components/GearMenu.tsx

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/AuthContext';
import { useParentControl } from '../features/auth/ParentControlContext';
import LocalizedText from './LocalizedText';

interface GearMenuProps {
  onClose(): void;
}

export default function GearMenu({ onClose }: GearMenuProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { userEmail, logout } = useAuth();
  const { enabled: parentControlOn, toggle } = useParentControl();

  const stopPropagation = (e: GestureResponderEvent) => e.stopPropagation();

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/screens/login');
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.menuContainer} onPress={stopPropagation}>
        <LocalizedText style={styles.menuTitle}>{t('settings')}</LocalizedText>

        {/* Language display */}
        <View style={styles.menuItem}>
          <LocalizedText style={styles.menuItemText}>{t('language')}</LocalizedText>
          <LocalizedText style={styles.menuItemText}>
            {i18n.language === 'ru'
              ? t('russian')
              : i18n.language === 'kk'
              ? t('kazakh')
              : t('english')}
          </LocalizedText>
        </View>

        {/* Account email */}
        <View style={styles.menuItem}>
          <LocalizedText style={styles.menuItemText}>{t('account')}</LocalizedText>
          <LocalizedText style={[styles.menuItemText, styles.emailText]} numberOfLines={1} ellipsizeMode="middle">
            {userEmail || ''}
          </LocalizedText>
        </View>

        {/* Parent control toggle */}
        <Pressable
          style={styles.menuItem}
          onPress={() => toggle(!parentControlOn)}
        >
          <LocalizedText style={styles.menuItemText}>{t('parental_control')}</LocalizedText>
          <LocalizedText style={styles.menuItemText}>
            {parentControlOn ? t('on') : t('off')}
          </LocalizedText>
        </Pressable>

        {/* Logout */}
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <LocalizedText style={[styles.menuItemText, styles.logoutText]}>
            {t('logout')}
          </LocalizedText>
        </Pressable>

        {/* Quick language switch */}
        <View style={styles.languageContainer}>
          {(['ru', 'kk', 'en'] as const).map((lng) => (
            <Pressable key={lng} onPress={() => i18n.changeLanguage(lng)}>
              <LocalizedText
                style={[
                  styles.menuItemText,
                  i18n.language === lng && styles.selectedLanguageText,
                ]}
              >
                {lng === 'ru' ? t('russian') : lng === 'kk' ? t('kazakh') : t('english')}
              </LocalizedText>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    width: 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  emailText: {
    width: 140,
    textAlign: 'right',
  },
  logoutText: {
    color: 'red',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
