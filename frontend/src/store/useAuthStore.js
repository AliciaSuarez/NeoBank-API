import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      user: null,

      setAuth: (token, userId, user) => set({ token, userId, user }),

      clearAuth: () => set({ token: null, userId: null, user: null }),
    }),
    {
      name: 'neobank-auth',
      // Only persist the token to localStorage; userId and user are re-derived on login
      partialize: (state) => ({ token: state.token, userId: state.userId }),
    }
  )
);

export default useAuthStore;
