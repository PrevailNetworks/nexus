import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import type { TimePunch, AppUser } from '../../types';
import { FIRESTORE_COLLECTIONS, TimePunchType } from '../../types';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';

const HeaderTimeclock: React.FC = () => {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const [lastPunch, setLastPunch] = useState<TimePunch | null>(null);
  const [isPunching, setIsPunching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [timer, setTimer] = useState<string | null>(null);

  const isEffectivelyClockedIn = lastPunch?.type === TimePunchType.IN || lastPunch?.type === TimePunchType.BREAK_END;
  const isOnBreak = lastPunch?.type === TimePunchType.BREAK_START;
  const isClockedIn = isEffectivelyClockedIn || isOnBreak;

  const fetchLastPunch = useCallback(async () => {
    if (!typedUser?.organizationId) {
      setIsLoading(false);
      return;
    }
    try {
      const punchesQuery = query(
        collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TIMEPUNCHES}`),
        where('userId', '==', typedUser.uid),
        orderBy('punchTime', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(punchesQuery);
      if (!querySnapshot.empty) {
        setLastPunch(querySnapshot.docs[0].data() as TimePunch);
      } else {
        setLastPunch(null);
      }
    } catch (err: any) {
      console.error("Error fetching last punch for header:", err);
      // If it's a permission error, the user might not have any punches yet
      if (err?.code === 'permission-denied') {
        setLastPunch(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [typedUser?.organizationId, typedUser?.uid]);

  useEffect(() => {
    fetchLastPunch();
  }, [fetchLastPunch]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isClockedIn && lastPunch?.punchTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const punchTimeMillis = lastPunch.punchTime.toMillis();
        const diff = now - punchTimeMillis;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimer(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      };
      updateTimer();
      intervalId = window.setInterval(updateTimer, 1000);
    } else {
      setTimer(null);
    }
    return () => window.clearInterval(intervalId);
  }, [isClockedIn, lastPunch]);

  const getLocation = (): Promise<GeoPoint | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
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

  const handlePunch = async (punchType: TimePunchType) => {
    if (!typedUser || isPunching) return;
    setIsPunching(true);

    const location = await getLocation();

    const punchData: Omit<TimePunch, 'id' | 'photoUrl'> = {
      userId: typedUser.uid,
      organizationId: typedUser.organizationId,
      punchTime: Timestamp.fromDate(new Date()),
      type: punchType,
      isAutoClockOut: false,
      deviceUsed: 'Desktop Web Header',
      ipAddress: 'N/A',
      ...(location && { location }),
    };

    try {
      await addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TIMEPUNCHES}`), punchData);
      fetchLastPunch();
      setIsPopoverOpen(false);
    } catch (err) {
      console.error("Punch action failed from header:", err);
    } finally {
      setIsPunching(false);
    }
  };

  const getStatusColor = () => {
    if (isOnBreak) return 'bg-yellow-500';
    if (isClockedIn) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isOnBreak) return 'On Break';
    if (isClockedIn) return 'Clocked In';
    return 'Clocked Out';
  };

  return (
    <DropdownMenu open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8">
          <Icon 
            name="punch_clock" 
            size={18} 
            className={isClockedIn ? 'text-green-500' : 'text-muted-foreground'} 
          />
          {isClockedIn && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getStatusColor()} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor()}`}></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-4">
        {isLoading ? (
          <div className="flex justify-center py-2">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div>
              <Badge 
                variant={isClockedIn ? "default" : "secondary"} 
                className={`mb-2 ${isOnBreak ? 'bg-yellow-500' : ''}`}
              >
                {getStatusText()}
              </Badge>
              {isClockedIn && timer && (
                <p className="text-2xl font-mono font-bold">{timer}</p>
              )}
            </div>
            
            {isClockedIn ? (
              isOnBreak ? (
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => handlePunch(TimePunchType.BREAK_END)} 
                  disabled={isPunching}
                >
                  {isPunching && <LoadingSpinner size="sm" className="mr-1" />}
                  End Break
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => handlePunch(TimePunchType.OUT)} 
                    disabled={isPunching}
                  >
                    {isPunching && <LoadingSpinner size="sm" className="mr-1" />}
                    Clock Out
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handlePunch(TimePunchType.BREAK_START)} 
                    disabled={isPunching}
                  >
                    {isPunching && <LoadingSpinner size="sm" className="mr-1" />}
                    Start Break
                  </Button>
                </div>
              )
            ) : (
              <Button 
                size="sm" 
                className="w-full" 
                onClick={() => handlePunch(TimePunchType.IN)} 
                disabled={isPunching}
              >
                {isPunching && <LoadingSpinner size="sm" className="mr-1" />}
                Clock In
              </Button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderTimeclock;