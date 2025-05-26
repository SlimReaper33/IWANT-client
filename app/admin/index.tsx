import React, { JSX, useEffect, useState } from 'react';
import {
    View,
    FlatList,
    Pressable,
    TextInput,
    StyleSheet,
    Alert,
    Text,
    Platform as RNPlatform,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import LocalizedText from '../../components/LocalizedText';
import * as ImagePicker from 'expo-image-picker';
import { ENDPOINTS } from '../../utils/config';
import { useKazakhRecorder } from '../../hooks/useKazakhRecoreder';
import { encryptAudio } from '../../utils/encryption';
import EditCardModal from '../../components/EditCardModal';
import { updateGlobalCard } from '../../utils/cards';

interface GlobalCard {
    _id: string;
    title: string;
    title_ru?: string;
    title_en?: string;
    title_kk?: string;
    imageUri: string;
    audio_kk?: string;
    section: string;
    line: number;
    page: number;
}

interface User {
    _id: string;
    email: string;
    role: string;
}

const sections = [
    { id: 'family', label: 'family' },
    { id: 'actions', label: 'actions' },
    { id: 'food', label: 'food' },
    { id: 'drinks', label: 'drinks' },
    { id: 'fruits_veggies', label: 'fruits_and_vegetables' },
    { id: 'toys', label: 'toys' },
    { id: 'emotions', label: 'emotions' },
    { id: 'character', label: 'character' },
    { id: 'professions', label: 'professions' },
    { id: 'animals', label: 'animals' },
    { id: 'clothing', label: 'clothing_and_shoes' },
    { id: 'dishes', label: 'dishes' },
    { id: 'technology', label: 'technology' },
    { id: 'transport', label: 'transport' },
    { id: 'places', label: 'places' },
    { id: 'nature', label: 'nature' },
    { id: 'holiday', label: 'holiday' },
    { id: 'colors_shapes', label: 'colors_and_shapes' },
    { id: 'school', label: 'school' },
    { id: 'sports', label: 'sports' },
    { id: 'numbers', label: 'numbers' },
    { id: 'body_parts', label: 'body_parts' },
];

export default function AdminPanel(): JSX.Element | null {
    const { t } = useTranslation();
    const router = useRouter();
    const { logout, userToken } = useAuth();

    // Data states
    const [cards, setCards] = useState<GlobalCard[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Multi-select states
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

    // New global card form
    const [title, setTitle] = useState<string>('');
    const [titleRu, setTitleRu] = useState<string>('');
    const [titleEn, setTitleEn] = useState<string>('');
    const [titleKk, setTitleKk] = useState<string>('');
    const [imageUri, setImageUri] = useState<string>('');
    const { recording, uri: recordedUri, start, stop, play } = useKazakhRecorder();
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0].id);
    const [line, setLine] = useState<number>(1);
    const [page, setPage] = useState<number>(1);

    // Edit modal
    const [editingCard, setEditingCard] = useState<GlobalCard | null>(null);
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

    // Load initial data
    useEffect(() => {
        (async () => {
            try {
                const [cardsRes, usersRes] = await Promise.all([
                    fetch(ENDPOINTS.ADMIN, { headers: { Authorization: `Bearer ${userToken}` } }),
                    fetch(ENDPOINTS.USERS, { headers: { Authorization: `Bearer ${userToken}` } }),
                ]);
                const cardsData = await cardsRes.json();
                const usersData = await usersRes.json();
                setCards(cardsData.cards || []);
                setUsers(usersData.users || []);
            } catch {
                Alert.alert(t('load_error'));
            }
        })();
    }, [userToken]);

    // Filtered users
    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handlers
    const handleDeleteCard = async (id: string) => {
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userToken}` },
            });
            if (res.ok) {
                setCards(prev => prev.filter(c => c._id !== id));
            } else {
                const { message } = await res.json();
                Alert.alert(message || t('card_delete_error'));
            }
        } catch {
            Alert.alert(t('card_delete_error'));
        }
    };

    const toggleUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    const toggleCard = (id: string) => {
        setSelectedCardIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    const toggleSelectAllCards = () => {
        setSelectedCardIds(prev =>
            prev.length === cards.length ? [] : cards.map(c => c._id)
        );
    };
    const handleCopy = async () => {
        if (!selectedUserIds.length || !selectedCardIds.length) {
            Alert.alert(t('select_user_and_card'));
            return;
        }
        let total = 0;
        for (const uid of selectedUserIds) {
            const res = await fetch(`${ENDPOINTS.GLOBAL}/copy`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, cardIds: selectedCardIds }),
            });
            const { cards: copied } = await res.json();
            total += copied.length;
        }
        Alert.alert(t('copied_count', { count: total }));
    };
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert(t('permission_error'));
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, aspect: [1, 1], allowsEditing: true });
        if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
    };

    const handleAddCard = async () => {
        if (!title) return Alert.alert(t('enter_title'));
        let finalAudio: string | undefined;
        if (recordedUri) {
            finalAudio = await encryptAudio(recordedUri);
        } else if (audioUri) {
            finalAudio = audioUri;
        }

        const form = new FormData();
        form.append('title', title);
        form.append('title_ru', titleRu);
        form.append('title_en', titleEn);
        form.append('title_kk', titleKk);
        form.append('section', selectedSectionId);
        form.append('line', String(line));
        form.append('page', String(page));

        if (imageUri) {
            const imgFile = RNPlatform.OS === 'web'
                ? new File([await (await fetch(imageUri)).blob()], 'img.jpg', { type: 'image/jpeg' })
                : { uri: imageUri, name: 'img.jpg', type: 'image/jpeg' } as any;
            form.append('image', imgFile);
        }

        if (finalAudio) {
            const afile = RNPlatform.OS === 'web'
                ? new File([await (await fetch(finalAudio)).blob()], 'recording.m4a', { type: 'audio/m4a' })
                : { uri: finalAudio, name: 'recording.m4a', type: 'audio/m4a' } as any;
            form.append('audio_kk', afile);
        }

        const res = await fetch(ENDPOINTS.ADMIN, {
            method: 'POST',
            headers: { Authorization: `Bearer ${userToken}` },
            body: form,
        });
        const data = await res.json();
        if (res.ok) {
            setCards(prev => [...prev, data.card]);
            // reset form
            setTitle(''); setTitleRu(''); setTitleEn(''); setTitleKk('');
            setImageUri(''); setAudioUri(null);
            setSelectedSectionId(sections[0].id); setLine(1); setPage(1);
        } else {
            Alert.alert(data.message || t('card_add_error'));
        }
    };

    if (!userToken) {
        // you could return a loader, or simply null
        return null;
    }

    return (
        <KeyboardAvoidingView
            behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                style={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <LocalizedText style={styles.header}>{t('admin_panel')}</LocalizedText>

                {/* Users */}
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('search_user')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <FlatList
                    data={filteredUsers}
                    horizontal
                    keyExtractor={u => u._id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item }) => {
                        const sel = selectedUserIds.includes(item._id);
                        return (
                            <Pressable
                                style={[styles.userItem, sel && styles.userItemSel]}
                                onPress={() => toggleUser(item._id)}
                            >
                                <Text style={styles.userEmail}>{item.email}</Text>
                            </Pressable>
                        );
                    }}
                />

                {/* Select all / none */}
                <Pressable style={styles.selectAllButton} onPress={toggleSelectAllCards}>
                    <LocalizedText style={styles.selectAllText}>
                        {selectedCardIds.length === cards.length
                            ? t('deselect_all_cards')
                            : t('select_all_cards')}
                    </LocalizedText>
                </Pressable>

                {/* Cards list */}
                <FlatList
                    data={cards}
                    keyExtractor={c => c._id}
                    renderItem={({ item }) => {
                        const sel = selectedCardIds.includes(item._id);
                        return (
                            <View style={[styles.cardRow, sel && styles.cardSel]}>
                                <Text>{item.title} ({item.section})</Text>
                                <View style={styles.cardActions}>
                                    <Pressable style={styles.actionBtn} onPress={() => toggleCard(item._id)}>
                                        <LocalizedText>{sel ? t('deselect') : t('select')}</LocalizedText>
                                    </Pressable>
                                    <Pressable
                                        style={styles.actionBtn}
                                        onPress={() => { setEditingCard(item); setEditModalVisible(true); }}
                                    >
                                        <LocalizedText>{t('edit')}</LocalizedText>
                                    </Pressable>
                                    <Pressable style={styles.actionBtn} onPress={() => handleDeleteCard(item._id)}>
                                        <LocalizedText>{t('delete')}</LocalizedText>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Copy */}
                <Pressable style={styles.copyButton} onPress={handleCopy}>
                    <LocalizedText style={styles.copyButtonText}>{t('copy_selected')}</LocalizedText>
                </Pressable>

                {/* New card form */}
                <View style={styles.form}>
                    <LocalizedText style={styles.fieldLabel}>{t('title_default')}</LocalizedText>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('title_default')} />
                    <LocalizedText style={styles.fieldLabel}>{t('title_ru')}</LocalizedText>
                    <TextInput style={styles.input} value={titleRu} onChangeText={setTitleRu} placeholder={t('title_ru')} />
                    <LocalizedText style={styles.fieldLabel}>{t('title_en')}</LocalizedText>
                    <TextInput style={styles.input} value={titleEn} onChangeText={setTitleEn} placeholder={t('title_en')} />
                    <LocalizedText style={styles.fieldLabel}>{t('title_kk')}</LocalizedText>
                    <TextInput style={styles.input} value={titleKk} onChangeText={setTitleKk} placeholder={t('title_kk')} />

                    <Pressable style={styles.imagePicker} onPress={pickImage}>
                        <LocalizedText>{imageUri ? t('change_image') : t('pick_image')}</LocalizedText>
                    </Pressable>

                    <Pressable
                        style={[styles.audioButton, recording && styles.recording]}
                        onPress={recording ? stop : start}
                    >
                        <LocalizedText>
                            {recording
                                ? t('stop_record')
                                : (recordedUri || audioUri)
                                    ? t('re_record')
                                    : t('record_kk')}
                        </LocalizedText>
                    </Pressable>
                    {(recordedUri || audioUri) && (
                        <Pressable style={styles.audioButton} onPress={() => play(recordedUri || audioUri!)}>
                            <LocalizedText>{t('play_kk')}</LocalizedText>
                        </Pressable>
                    )}

                    <View style={styles.sectionContainer}>
                        {sections.map(sec => (
                            <Pressable
                                key={sec.id}
                                style={[styles.sectionBtn, selectedSectionId === sec.id && styles.sectionBtnSel]}
                                onPress={() => setSelectedSectionId(sec.id)}
                            >
                                <LocalizedText>{t(sec.label)}</LocalizedText>
                            </Pressable>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        keyboardType='number-pad'
                        value={String(line)}
                        onChangeText={v => setLine(+v || 1)}
                        placeholder={t('line')}
                    />
                    <TextInput
                        style={styles.input}
                        keyboardType='number-pad'
                        value={String(page)}
                        onChangeText={v => setPage(+v || 1)}
                        placeholder={t('page')}
                    />

                    <Pressable style={styles.addButton} onPress={handleAddCard}>
                        <LocalizedText style={styles.addButtonText}>{t('add_card')}</LocalizedText>
                    </Pressable>
                </View>

                {/* Edit modal */}
                {editingCard && (
                    <EditCardModal
                        mode="admin"
                        visible={editModalVisible}
                        currentTitle={editingCard.title}
                        currentTitleRu={editingCard.title_ru}
                        currentTitleEn={editingCard.title_en}
                        currentTitleKk={editingCard.title_kk}
                        currentImageUri={editingCard.imageUri}
                        currentAudioUri={editingCard.audio_kk}
                        onConfirm={async (newTitle, newRu, newEn, newKk, newImg, newAudio) => {
                            const updated = await updateGlobalCard(
                                editingCard._id,
                                {
                                    title: newTitle,
                                    title_ru: newRu,
                                    title_en: newEn,
                                    title_kk: newKk,
                                    section: editingCard.section,
                                    line: editingCard.line,
                                    page: editingCard.page,
                                },
                                newImg,
                                newAudio,
                                userToken!
                            );
                            setCards(prev =>
                                prev.map(c =>
                                    c._id === updated._id
                                        ? updated    // updated теперь действительно GlobalCard
                                        : c          // иначе исходная карточка
                                )
                            );
                            setEditModalVisible(false);
                        }}
                        onDelete={async () => {
                            await handleDeleteCard(editingCard._id);
                            setEditModalVisible(false);
                        }}
                        onCancel={() => setEditModalVisible(false)}
                    />
                )}

                {/* Logout */}
                <Pressable
                    style={styles.logoutButton}
                    onPress={async () => {
                        await logout();
                        router.replace('/login');
                    }}
                >
                    <LocalizedText style={styles.logoutText}>{t('logout')}</LocalizedText>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { backgroundColor: '#FFF' },
    contentContainer: { padding: 16 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    searchInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 6, padding: 8, marginBottom: 8 },
    userItem: { padding: 6, margin: 4, borderWidth: 1, borderColor: '#CCC', borderRadius: 6 },
    userItemSel: { backgroundColor: '#C3947A' },
    userEmail: { fontSize: 14 },
    selectAllButton: { padding: 8, alignSelf: 'flex-start', marginVertical: 8 },
    selectAllText: { fontWeight: 'bold', color: '#007AFF' },
    cardRow: { padding: 8, marginVertical: 4, borderWidth: 1, borderColor: '#EEE', borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardSel: { backgroundColor: '#E0F7FA' },
    cardActions: { flexDirection: 'row' },
    actionBtn: { marginLeft: 8, padding: 4 },
    copyButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center', marginVertical: 12 },
    copyButtonText: { color: '#FFF', fontWeight: 'bold' },
    form: { marginTop: 20 },
    fieldLabel: { fontWeight: 'bold', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 6, padding: 8, marginBottom: 12 },
    imagePicker: { backgroundColor: '#EEE', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
    audioButton: { backgroundColor: '#D0F0C0', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
    recording: { backgroundColor: '#F08080' },
    sectionContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    sectionBtn: { padding: 8, margin: 4, backgroundColor: '#EEE', borderRadius: 6 },
    sectionBtnSel: { backgroundColor: '#C3947A' },
    addButton: { backgroundColor: '#C3947A', padding: 12, borderRadius: 6, alignItems: 'center' },
    addButtonText: { color: '#FFF', fontWeight: 'bold' },
    logoutButton: {
        backgroundColor: '#AAA',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginVertical: 16,
    },
    logoutText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
