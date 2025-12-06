// src/store/useDrawStore.js
import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const PRIZE_DOC = doc(db, 'settings', 'prizes');
const MAX_PRIZES = 100; // 필요 개수로 변경

const useDrawStore = create((set, get) => ({
    prizes: [],
    displayMode: 'both',
    isLocked: false,
    isClosed: false,
    noticeMessage: '', // 안내문구 상태
    themeColor: 'gradient1',
    isTestMode: false, // 🔹 리허설 모드

    setClosed: (value) => set({ isClosed: value }),
    setLocked: (locked) => set({ isLocked: locked }),
    setDisplayMode: (mode) => set({ displayMode: mode }),
    setNoticeMessage: (msg) => set({ noticeMessage: msg }),
    setThemeColor: (colorName) => set({ themeColor: colorName }),
    setTestMode: (value) => set({ isTestMode: value }), // 🔹 리허설 모드 setter

    loadFromFirebase: async () => {
        const snap = await getDoc(PRIZE_DOC);
        if (snap.exists()) {
            const data = snap.data();
            const prizesWithDefaults = (data.prizes || []).map((p) => ({
                ...p,
                requiresShipping: p.requiresShipping ?? false,
            }));

            set({
                prizes: prizesWithDefaults,
                displayMode: data.displayMode || 'both',
                isLocked: data.isLocked || false,
                isClosed: data.isClosed || false,
                noticeMessage: data.noticeMessage || '',
                themeColor: data.themeColor || 'gradient1',
                isTestMode: data.isTestMode ?? false, // 🔹 리허설 모드 로드
            });
        }
    },

    listenToFirebase: () => {
        // onSnapshot의 반환값(언서브 함수)을 리턴해야 useEffect 클린업에서 사용할 수 있음
        return onSnapshot(PRIZE_DOC, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const prizesWithDefaults = (data.prizes || []).map((p) => ({
                    ...p,
                    requiresShipping: p.requiresShipping ?? false,
                }));

                set({
                    prizes: prizesWithDefaults,
                    displayMode: data.displayMode || 'both',
                    isLocked: data.isLocked || false,
                    isClosed: data.isClosed || false,
                    noticeMessage: data.noticeMessage || '',
                    themeColor: data.themeColor || 'gradient1',
                    isTestMode: data.isTestMode ?? false, // 🔹 실시간 반영
                });
            }
        });
    },

    saveToFirebase: async () => {
        const {
            prizes,
            displayMode,
            isLocked,
            isClosed,
            noticeMessage,
            themeColor,
            isTestMode, // 🔹 저장
        } = get();

        await setDoc(PRIZE_DOC, {
            prizes,
            displayMode,
            isLocked,
            isClosed,
            noticeMessage,
            themeColor,
            isTestMode, // 🔹 Firestore에 저장
        });
    },

    updatePrize: (index, updated) =>
        set((state) => {
            const newPrizes = [...state.prizes];
            newPrizes[index] = {
                ...newPrizes[index],
                ...updated,
            };
            return { prizes: newPrizes };
        }),

    addPrize: () =>
        set((state) => {
            const nextRank = state.prizes.length + 1;
            if (nextRank > MAX_PRIZES) return state;
            return {
                prizes: [
                    ...state.prizes,
                    {
                        rank: nextRank,
                        name: '',
                        quantity: 0,
                        remaining: 0,
                        requiresShipping: false,
                    },
                ],
            };
        }),

    deletePrize: (index) =>
        set((state) => {
            const updated = [...state.prizes];
            updated.splice(index, 1);
            updated.forEach((p, i) => (p.rank = i + 1));
            return { prizes: updated };
        }),
}));

export default useDrawStore;
