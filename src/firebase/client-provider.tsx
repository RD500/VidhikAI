"use client";
import { app } from "./config";
import { FirebaseProvider } from "./provider";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useMemo } from "react";

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const providers = useMemo(() => {
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { auth, firestore };
  }, []);

  return <FirebaseProvider {...providers}>{children}</FirebaseProvider>;
}
