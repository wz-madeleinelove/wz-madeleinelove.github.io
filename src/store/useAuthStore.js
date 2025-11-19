// src/store/useAuthStore.js
import {
    create
} from 'zustand';
import {
    auth
} from '../firebase/firebaseAuth';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getIdTokenResult,
} from 'firebase/auth';

const useAuthStore = create((set) => ({
    user: null,
    isAdmin: false,

    login: async (email, password) => {
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const token = await getIdTokenResult(userCred.user);
            const isAdmin = token.claims.isAdmin === true;

            set({
                user: userCred.user,
                isAdmin
            });
            return isAdmin;
        } catch (e) {
            return false;
        }
    },

    logout: async () => {
        await signOut(auth);
        set({
            user: null,
            isAdmin: false
        });
    },

    listenAuthState: () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const tokenResult = await getIdTokenResult(user);
                const isAdmin = tokenResult.claims.isAdmin === true;
                set({
                    user,
                    isAdmin
                });
            } else {
                set({
                    user: null,
                    isAdmin: false
                });
            }
        });
    },
}));

export default useAuthStore;
