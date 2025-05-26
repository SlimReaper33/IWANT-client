import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';

const { width, height } = Dimensions.get('window');

interface Slide {
  key: string;
  image: any;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    key: '1',
    image: require('../assets/IWANT.png'),
    title: 'feature1Title',
    subtitle: 'feature1Subtitle',
  },
];

export default function welcomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'ru' | 'kk' | 'en'>('ru');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Загрузка сохраненного языка
    AsyncStorage.getItem('appLanguage').then(lang => {
      if (lang && ['ru','kk','en'].includes(lang)) {
        setSelectedLanguage(lang as 'ru'|'kk'|'en');
        i18n.changeLanguage(lang);
      }
    });
  }, []);

  const handleLanguageChange = async (lang: 'ru' | 'kk' | 'en') => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem('appLanguage', lang);
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const newIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: newIndex * width, animated: true });
      setCurrentIndex(newIndex);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      scrollRef.current?.scrollTo({ x: newIndex * width, animated: true });
      setCurrentIndex(newIndex);
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.slidesContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
          {slides.map(slide => (
            <View key={slide.key} style={[styles.slide, { width }]}>              
              <Image source={slide.image} style={styles.image} resizeMode="contain" />
              <LocalizedText style={styles.slideTitle}>{slide.title}</LocalizedText>
              <LocalizedText style={styles.slideSubtitle}>{slide.subtitle}</LocalizedText>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navButtonsContainer}>
        {currentIndex > 0 && (
          <Pressable style={styles.navButton} onPress={handleBack}>
            <LocalizedText style={styles.navButtonText}>back</LocalizedText>
          </Pressable>
        )}
        {currentIndex < slides.length - 1 && (
          <Pressable style={styles.navButton} onPress={handleNext}>
            <LocalizedText style={styles.navButtonText}>next</LocalizedText>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.startButton} onPress={handleStart}>
        <LocalizedText style={styles.startButtonText}>start</LocalizedText>
      </Pressable>

      <View style={styles.languageSwitch}>
        {(['ru','kk','en'] as const).map(lang => (
          <Pressable
            key={lang}
            onPress={() => handleLanguageChange(lang)}
            style={[
              styles.langButton,
              selectedLanguage === lang && styles.activeLangButton,
            ]}
          >
            <LocalizedText
              style={
                selectedLanguage === lang
                  ? styles.activeLangButtonText
                  : styles.langButtonText
              }
            >
              {lang}
            </LocalizedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C3947A' },
  slidesContainer: { width, height: height * 0.5, justifyContent: 'center' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  image: { width: 180, height: 180, marginBottom: 20 },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: { fontSize: 16, color: '#FFF', textAlign: 'center', maxWidth: 280 },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    alignSelf: 'center',
    marginTop: 10,
  },
  navButton: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navButtonText: { color: '#C3947A', fontWeight: 'bold', fontSize: 16 },
  startButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  startButtonText: { color: '#C3947A', fontSize: 20, fontWeight: 'bold' },
  languageSwitch: { flexDirection: 'row', justifyContent: 'center', alignSelf: 'center', marginTop: 20 },
  langButton: { padding: 8, marginHorizontal: 5, backgroundColor: '#EEE', borderRadius: 4 },
  activeLangButton: { backgroundColor: '#FFF' },
  langButtonText: { color: '#333', fontWeight: 'bold' },
  activeLangButtonText: { color: '#C3947A', fontWeight: 'bold' },
});
