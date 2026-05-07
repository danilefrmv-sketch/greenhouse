import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyBSslAz7F1vu3qpAFCtGRnXLgEbO7Lc_8E',
  authDomain:        'teplitsa-a357f.firebaseapp.com',
  projectId:         'teplitsa-a357f',
  storageBucket:     'teplitsa-a357f.firebasestorage.app',
  messagingSenderId: '731543603745',
  appId:             '1:731543603745:web:099124580fcab129507160',
  measurementId:     'G-TCZBRJ9SN7',
}

export const app            = initializeApp(firebaseConfig)
export const auth           = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
