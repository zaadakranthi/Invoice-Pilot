
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserProfile, getUser } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useData } from '@/context/data-context';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 68.7C308.6 106.6 280.1 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading, authError] = useAuthState(auth);
  const [isProcessingLogin, setIsProcessingLogin] = useState(true);
  const { authUser, isReady } = useData();

  useEffect(() => {
    // This effect handles redirection based on auth state
    if (authLoading) {
        setIsProcessingLogin(true);
        return;
    }
    
    if (user && isReady && authUser) {
      if (authUser.onboarded) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } else if (!user) {
      // If there's no firebase user, we are ready for a login attempt.
      setIsProcessingLogin(false);
    }
  }, [user, authUser, authLoading, isReady, router]);

  const handleUserProfile = async (firebaseUser: FirebaseUser) => {
    // 1. Ensure profile exists. This function is idempotent.
    await createUserProfile(firebaseUser);
    
    // 2. Fetch the profile.
    const userProfile = await getUser(firebaseUser.uid);
    
    if (userProfile) {
      // The context will pick up the new user automatically.
      // No need to call setAuthUser here.
      // Routing is handled by the useEffect hook.
    } else {
      throw new Error("Could not retrieve user profile after creation.");
    }
  };

  const signInWithGoogle = async () => {
    setIsProcessingLogin(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await handleUserProfile(result.user);
        // The useEffect will handle redirection once the context is ready.
      } else {
        throw new Error('No user information received from Google.');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
          toast({ variant: 'destructive', title: 'Popup Blocked', description: 'Please allow popups for this site to sign in.' });
      } else if (error.code !== 'auth/popup-closed-by-user') {
          console.error("Error during signInWithPopup: ", error);
          toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
      }
      setIsProcessingLogin(false);
    }
  };

  if (isProcessingLogin) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to InvoicePilot</CardTitle>
          <CardDescription>
            Sign in to manage your business finances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={signInWithGoogle}
            disabled={isProcessingLogin}
          >
            <GoogleIcon />
            Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
