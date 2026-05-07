import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { syncDown, syncUp } from '../lib/firestoreSync'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  // undefined = ещё грузим, null = не авторизован, object = пользователь
  const [user, setUser]     = useState(undefined)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        // Пробуем загрузить данные из Firestore
        const hasData = await syncDown(u.uid)
        if (!hasData) {
          // Первый вход — загружаем localStorage → Firestore
          await syncUp(u.uid)
        }
        setSynced(true)
      } else {
        setSynced(false)
      }
      setUser(u ?? null)
    })
    return unsub
  }, [])

  const signInWithGoogle = () =>
    signInWithPopup(auth, googleProvider).catch(e => {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
        return signInWithRedirect(auth, googleProvider)
      }
      throw e
    })

  const logout = () => signOut(auth)

  return (
    <AuthCtx.Provider value={{ user, synced, signInWithGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}
