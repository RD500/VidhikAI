"use client";
import {
  type Auth,
} from "firebase/auth";
import { type Firestore } from "firebase/firestore";
import {
  useContext,
  createContext,
  type ReactNode,
} from "react";

export type FirebaseProviderProps = {
  auth: Auth;
  firestore: Firestore;
  children: ReactNode;
};

const FirebaseAuthContext = createContext<Auth | undefined>(undefined);
const FirebaseFirestoreContext = createContext<Firestore | undefined>(
  undefined,
);

export const FirebaseProvider = ({
  auth,
  firestore,
  children,
}: FirebaseProviderProps) => {
  return (
    <FirebaseAuthContext.Provider value={auth}>
      <FirebaseFirestoreContext.Provider value={firestore}>
        {children}
      </FirebaseFirestoreContext.Provider>
    </FirebaseAuthContext.Provider>
  );
};

export const useAuth = () => {
  const auth = useContext(FirebaseAuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within a FirebaseProvider");
  }
  return auth;
};

export const useFirestore = () => {
  const firestore = useContext(FirebaseFirestoreContext);
  if (!firestore) {
    throw new Error("useFirestore must be used within a FirebaseProvider");
  }
  return firestore;
};
