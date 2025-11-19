import {
    create
} from 'zustand';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import {
    db
} from '../firebase/firebaseConfig';

const PRIZE_DOC = doc(db, 'settings', 'prizes');
const MAX_PRIZES = 100; // 필요 개수로 변경

const useDrawStore = create((set, get) => ({
    prizes: [],
    displayMode: 'both',
    isLocked: false,
    isClosed: false,
    noticeMessage: '', // ✅ 안내문구 상태 추가
    themeColor: 'gradient1',

    setClosed: (value) => set({
        isClosed: value
    }),
    setLocked: (locked) => set({
        isLocked: locked
    }),
    setDisplayMode: (mode) => set({
        displayMode: mode
    }),
    setNoticeMessage: (msg) => set({
        noticeMessage: msg
    }), // ✅ 안내문구 setter 추가
    setThemeColor: (colorName) => set({
        themeColor: colorName
    }),

    loadFromFirebase: async () => {
        const snap = await getDoc(PRIZE_DOC);
        if (snap.exists()) {
            const data = snap.data();
            const prizesWithDefaults = (data.prizes || []).map((p) => ({
                ...p,
                requiresShipping: p.requiresShipping ?? false, // ✅ 오류 수정 (??)
            }));

            set({
                prizes: prizesWithDefaults,
                displayMode: data.displayMode || 'both',
                isLocked: data.isLocked || false,
                isClosed: data.isClosed || false,
                noticeMessage: data.noticeMessage || '', // ✅ 안내문구 로드
                themeColor: data.themeColor || 'gradient1',
            });
        }
    },

    listenToFirebase: () => {
        onSnapshot(PRIZE_DOC, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const prizesWithDefaults = (data.prizes || []).map((p) => ({
                    ...p,
                    requiresShipping: p.requiresShipping ?? false, // ✅ 오류 수정 (??)
                }));

                set({
                    prizes: prizesWithDefaults,
                    displayMode: data.displayMode || 'both',
                    isLocked: data.isLocked || false,
                    isClosed: data.isClosed || false,
                    noticeMessage: data.noticeMessage || '', // ✅ 안내문구 실시간 반영
                    themeColor: data.themeColor || 'gradient1',
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
            noticeMessage, // ✅ 안내문구 포함
            themeColor
        } = get();

        await setDoc(PRIZE_DOC, {
            prizes,
            displayMode,
            isLocked,
            isClosed,
            noticeMessage, // ✅ Firestore에 저장
            themeColor
        });
    },

    updatePrize: (index, updated) =>
        set((state) => {
            const newPrizes = [...state.prizes];
            newPrizes[index] = {
                ...newPrizes[index],
                ...updated,
            };
            return {
                prizes: newPrizes
            };
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
            return {
                prizes: updated
            };
        }),
}));

export default useDrawStore;
