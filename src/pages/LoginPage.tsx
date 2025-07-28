import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/loading';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Role, FIRESTORE_COLLECTIONS } from '../types';
import type { Organization, AppUser, Invite } from '../types';

type SignupMode = 'register' | 'invite';

const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  // Invite handling
  const [mode, setMode] = useState<SignupMode>('register');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Check for invite on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const inviteId = searchParams.get('inviteId');

    if (inviteId) {
      setIsLoading(true);
      setMode('invite');
      const fetchInvite = async () => {
        try {
          const inviteDocRef = doc(firestore, FIRESTORE_COLLECTIONS.INVITES, inviteId);
          const inviteDocSnap = await getDoc(inviteDocRef);
          if (inviteDocSnap.exists()) {
            const inviteData = { id: inviteDocSnap.id, ...(inviteDocSnap.data() as Omit<Invite, 'id'>) } as Invite;
            setInvite(inviteData);
            setDisplayName(inviteData.displayName || '');
            setEmail(inviteData.email);
            setOrganizationName(inviteData.organizationName);
          } else {
            setInviteError("This invitation is invalid or has expired. Please ask your administrator for a new invite.");
          }
        } catch (e) {
          setInviteError("There was an error verifying your invitation.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvite();
    }
  }, [location.search]);

  // Redirect if already authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!organizationName.trim()) {
      setError("Organization name is required.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, { displayName });
        const batch = writeBatch(firestore);
        const orgRef = doc(collection(firestore, FIRESTORE_COLLECTIONS.ORGANIZATIONS));
        
        // Set default settings for the new organization
        batch.set(orgRef, {
          name: organizationName,
          ownerId: user.uid,
          createdAt: Timestamp.now(),
          settings: {
            enablePhotoOnPunch: false,
            enableGpsTracking: false,
            timeOffPolicies: {
              leaveTypes: ['Vacation', 'Sick Day', 'Personal'],
            },
            loginCustomization: {
              backgroundColor: '#f0f1f3',
              primaryColor: '#748297',
            },
            phone: '',
            dateFormat: 'mm/dd/yyyy',
            teamSize: '',
          }
        } as Organization);

        const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
        const newAdminUser: AppUser = { 
          uid: user.uid, 
          email: user.email, 
          displayName,
          firstName: displayName.split(' ')[0] || '',
          lastName: displayName.split(' ').slice(1).join(' ') || '',
          role: Role.ADMIN, 
          organizationId: orgRef.id, 
          status: 'active',
          onboardingCompleted: false,
        };
        batch.set(userDocRef, newAdminUser);
        
        await batch.commit();
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(err.code === 'auth/email-already-in-use' ? 'This email is already in use.' : 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) {
      setError("Invitation details are missing.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: invite.displayName });
        
        const { id, organizationName, ...userDataFromInvite } = invite;

        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
        batch.set(userDocRef, { 
          ...userDataFromInvite,
          uid: user.uid,
          email: user.email, 
          status: 'active',
          onboardingCompleted: true, // Invited users don't need to onboard the org
        });
        const inviteDocRef = doc(firestore, FIRESTORE_COLLECTIONS.INVITES, invite.id);
        batch.delete(inviteDocRef);
        await batch.commit();
      }
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      setError(err.code === 'auth/email-already-in-use' ? 'An account with this email already exists. Please log in.' : 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - need to create organization
        setError('Please create an account with organization details using the signup form.');
        await result.user.delete(); // Remove the created auth user
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              N
            </div>
            <span className="font-semibold text-2xl">Nexus</span>
          </div>
          <CardTitle>Welcome to Nexus</CardTitle>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {inviteError && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {mode === 'invite' ? (
              // Invite acceptance form
              <>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Accept Your Invitation</h3>
                  <p className="text-muted-foreground">You've been invited to join <strong>{organizationName}</strong></p>
                </div>
                <form onSubmit={handleAcceptInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Full Name</Label>
                    <Input
                      id="invite-name"
                      type="text"
                      value={displayName}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-password">Create Password</Label>
                    <Input
                      id="invite-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-confirm">Confirm Password</Label>
                    <Input
                      id="invite-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Join & Create Account
                  </Button>
                </form>
              </>
            ) : (
              // Regular login/signup
              <>
                <Button 
                  onClick={handleGoogleSignIn} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  Sign in with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Create Organization</TabsTrigger>
                  </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleRegisterBusiness} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-org">Organization Name</Label>
                    <Input
                      id="signup-org"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Enter your company name"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Your Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Your Email (Admin Access)</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Create Organization
                  </Button>
                </form>
              </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;