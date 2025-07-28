import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp, GeoPoint, collection, query, where, orderBy, limit, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { firestore, storage } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import type { TimePunch, AppUser, Organization } from '../../types';
import { FIRESTORE_COLLECTIONS, TimePunchType } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { LoadingSpinner } from '../ui/loading';
import { Icon } from '../ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const TimeclockWidget: React.FC = () => {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const [lastPunch, setLastPunch] = useState<TimePunch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<string | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<Organization['settings'] | null>(null);

  // Webcam and photo state
  const [isWebcamModalOpen, setWebcamModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  const enablePhotoOnPunch = organizationSettings?.enablePhotoOnPunch ?? false;
  const enableGpsTracking = organizationSettings?.enableGpsTracking ?? false;
  
  const isEffectivelyClockedIn = lastPunch?.type === TimePunchType.IN || lastPunch?.type === TimePunchType.BREAK_END;
  const isOnBreak = lastPunch?.type === TimePunchType.BREAK_START;
  const isClockedIn = isEffectivelyClockedIn || isOnBreak;

  const fetchInitialData = useCallback(async () => {
    if (!typedUser?.organizationId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const orgDocRef = doc(firestore, FIRESTORE_COLLECTIONS.ORGANIZATIONS, typedUser.organizationId);
      const punchesQuery = query(
        collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TIMEPUNCHES}`),
        where('userId', '==', typedUser.uid),
        orderBy('punchTime', 'desc'),
        limit(1)
      );
      
      const [orgDocSnap, punchesSnapshot] = await Promise.all([
          getDoc(orgDocRef),
          getDocs(punchesQuery)
      ]);

      if (orgDocSnap.exists()) {
        setOrganizationSettings((orgDocSnap.data() as Organization)?.settings || null);
      }
      
      if (!punchesSnapshot.empty) {
        setLastPunch(punchesSnapshot.docs[0].data() as TimePunch);
      } else {
        setLastPunch(null);
      }
    } catch (err) {
      console.error("Error fetching initial data for time card widget:", err);
      setError("Could not load time card data.");
    } finally {
      setIsLoading(false);
    }
  }, [typedUser?.organizationId, typedUser?.uid]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  useEffect(() => {
    let intervalId: number | undefined;
    if (isClockedIn && lastPunch?.punchTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const punchTimeMillis = lastPunch.punchTime.toMillis();
        const diff = now - punchTimeMillis;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        setTimer(`${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`);
      };
      updateTimer();
      intervalId = window.setInterval(updateTimer, 60000);
    } else {
      setTimer(null);
    }
    return () => window.clearInterval(intervalId);
  }, [isClockedIn, lastPunch]);

  const getLocation = (): Promise<GeoPoint | null> => {
    return new Promise((resolve) => {
        if (!enableGpsTracking || !navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(new GeoPoint(position.coords.latitude, position.coords.longitude)),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
  };
  
  const uploadCapturedImage = async (): Promise<string | null> => {
    if (!capturedImage || !typedUser) return null;
    
    try {
        const blob = await (await fetch(capturedImage)).blob();
        const compressedBlob = await imageCompression(blob as File, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
        const filePath = `punch-photos/${typedUser.organizationId}/${typedUser.uid}/${Date.now()}.jpg`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, compressedBlob);
        return await getDownloadURL(fileRef);
    } catch (uploadError) {
        console.error("Failed to upload photo:", uploadError);
        setError("Could not upload photo. Punching without it.");
        return null;
    }
  };

  const executePunch = async (punchType: TimePunchType) => {
    if (!typedUser || isPunching) return;
    
    if(enablePhotoOnPunch && punchType === TimePunchType.IN && !capturedImage) {
        setWebcamModalOpen(true);
        return;
    }

    setIsPunching(true);
    setError(null);
    
    try {
        const [location, photoUrl] = await Promise.all([
            getLocation(),
            uploadCapturedImage()
        ]);

        const punchData: Omit<TimePunch, 'id'> = {
            userId: typedUser.uid,
            organizationId: typedUser.organizationId,
            punchTime: Timestamp.now(),
            type: punchType,
            comment: comment || undefined,
            isAutoClockOut: false,
            ipAddress: 'N/A',
            deviceUsed: 'Web Dashboard',
            ...(location && { location }),
            ...(photoUrl && { photoUrl }),
        };
        
        await addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TIMEPUNCHES}`), punchData);
        
        setComment('');
        setCapturedImage(null);
        setWebcamModalOpen(false);
        await fetchInitialData();

    } catch (e) {
        console.error("Punch failed:", e);
        setError("Punch failed. Please try again.");
    } finally {
        setIsPunching(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopWebcam();
    }
  };
  
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isWebcamModalOpen) {
        setPhotoError(null);
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }).catch(err => {
            console.error(err);
            setPhotoError("Could not access webcam. Please check permissions.");
        });
    } else {
        stopWebcam();
    }
  }, [isWebcamModalOpen]);

  const renderButtons = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      );
    }
    
    if (isClockedIn) {
      if (isOnBreak) {
        return (
          <Button 
            onClick={() => executePunch(TimePunchType.BREAK_END)} 
            className="w-full" 
            disabled={isPunching}
          >
            {isPunching && <LoadingSpinner size="sm" className="mr-2" />}
            End Break
          </Button>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => executePunch(TimePunchType.OUT)} 
            variant="destructive" 
            className="w-full" 
            disabled={isPunching}
          >
            {isPunching && <LoadingSpinner size="sm" className="mr-2" />}
            Clock Out
          </Button>
          <Button 
            onClick={() => executePunch(TimePunchType.BREAK_START)} 
            variant="outline" 
            className="w-full" 
            disabled={isPunching}
          >
            {isPunching && <LoadingSpinner size="sm" className="mr-2" />}
            Start Break
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        onClick={() => executePunch(TimePunchType.IN)} 
        className="w-full" 
        disabled={isPunching}
      >
        {isPunching && <LoadingSpinner size="sm" className="mr-2" />}
        Clock In
      </Button>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="punch_clock" size={20} />
            Time Clock
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          <div className="text-center mb-6">
            <p className="text-3xl font-bold mb-2">
              {isClockedIn ? (isOnBreak ? 'On Break' : 'Clocked In') : 'Clocked Out'}
            </p>
            <p className="text-muted-foreground mb-2">
              {new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric'
              })}
            </p>
            {isClockedIn && timer && (
              <p className="text-xl font-mono text-primary">{timer}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <Input 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              disabled={isPunching}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            {renderButtons()}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isWebcamModalOpen} onOpenChange={setWebcamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo Capture</DialogTitle>
          </DialogHeader>
          {capturedImage ? (
            <div className="text-center">
              <img src={capturedImage} alt="Captured punch" className="rounded-lg max-w-full mx-auto mb-4" />
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setCapturedImage(null)}>
                  Retake
                </Button>
                <Button onClick={() => executePunch(TimePunchType.IN)}>
                  Confirm & Clock In
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <video ref={videoRef} autoPlay playsInline className="w-full bg-muted rounded-lg mb-4" />
              {photoError && <p className="text-destructive text-sm mb-2">{photoError}</p>}
              <Button onClick={handleCapture} disabled={!!photoError}>
                <Icon name="camera" size={16} className="mr-2"/> 
                Capture
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeclockWidget;