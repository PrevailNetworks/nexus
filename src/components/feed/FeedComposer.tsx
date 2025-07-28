import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { firestore, storage } from '../../lib/firebase';
import type { AppUser, Team } from '../../types';
import { GeoPoint, FIRESTORE_COLLECTIONS } from '../../types';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface FeedComposerProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  allTeams: Team[];
  onPostSuccess?: () => void;
}

const FeedComposer: React.FC<FeedComposerProps> = ({ 
  currentUser, 
  allUsers, 
  allTeams: _allTeams, 
  onPostSuccess 
}) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<AppUser[]>([]);
  
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [location, setLocation] = useState<{name: string, coords: GeoPoint} | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    const cursorPosition = e.target.selectionStart;
    const textUpToCursor = text.substring(0, cursorPosition);
    const mentionMatch = textUpToCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionQuery(null);
    }
  };
  
  useEffect(() => {
    if (mentionQuery !== null) {
      const suggestions = allUsers.filter(u => 
        u.displayName?.toLowerCase().includes(mentionQuery.toLowerCase()) || 
        (u.username && u.username.toLowerCase().includes(mentionQuery.toLowerCase()))
      ).slice(0, 5);
      setMentionSuggestions(suggestions);
    } else {
      setMentionSuggestions([]);
    }
  }, [mentionQuery, allUsers]);

  const handleMentionSelect = (user: AppUser) => {
    const username = user.username || user.displayName?.replace(/\s/g, '') || '';
    if (!username || !textareaRef.current) return;

    const text = content;
    const cursorPosition = textareaRef.current.selectionStart;
    const textUpToCursor = text.substring(0, cursorPosition);
    
    const newTextStart = textUpToCursor.replace(/@(\w*)$/, `@${username} `);
    const newText = newTextStart + text.substring(cursorPosition);
    
    setContent(newText);
    setMentionQuery(null);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPosition = newTextStart.length;
      textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage({ dataUrl: reader.result as string, file: compressedFile as File });
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression error:', error);
        setError('Failed to compress image.');
      }
    }
  };

  const handleFormat = (formatType: 'bold' | 'italic') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selectedText = content.substring(start, end);
    const wrap = formatType === 'bold' ? '**' : '*';
    const newText = `${content.substring(0, start)}${wrap}${selectedText}${wrap}${content.substring(end)}`;
    setContent(newText);
  };

  const handleGetLocation = () => {
    if (location) {
      setLocation(null);
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          name: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
          coords: new GeoPoint(latitude, longitude)
        });
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Could not get location. Please check browser permissions.");
        setIsFetchingLocation(false);
      }
    );
  };

  const clearForm = () => {
    setContent('');
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setScheduledAt('');
    setScheduleOpen(false);
    setLocation(null);
    setError('');
  }

  const handleSubmit = async () => {
    if (!content.trim() && !image) {
      setError('Cannot post an empty message.');
      return;
    }
    if (!currentUser.organizationId) {
      setError('Organization not found.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl: string | undefined = undefined;
      if (image) {
        const imageRef = ref(storage, `feed-images/${currentUser.organizationId}/${Date.now()}-${image.file.name}`);
        await uploadString(imageRef, image.dataUrl, 'data_url');
        imageUrl = await getDownloadURL(imageRef);
      }
      
      const userMentions = (content.match(/@(\w+)/g) || [])
        .map(mention => mention.substring(1))
        .map(username => allUsers.find(u => u.username === username || u.displayName?.replace(/\s/g, '') === username)?.uid)
        .filter((uid): uid is string => !!uid);
        
      const teamMentions: string[] = [];

      const visibility = content.includes('@everyone') ? 'everyone'
        : teamMentions.length > 0 ? 'teams'
        : userMentions.length > 0 ? 'users'
        : 'everyone';

      const feedCollectionRef = collection(firestore, `organizations/${currentUser.organizationId}/${FIRESTORE_COLLECTIONS.FEED}`);
      
      const postData: any = {
        authorId: currentUser.uid,
        content,
        mentions: { userIds: userMentions, teamIds: teamMentions },
        visibility,
        createdAt: serverTimestamp() as Timestamp,
        reactions: {},
        replyCount: 0,
        ...(imageUrl && { imageUrl }),
        ...(location && { locationName: location.name, locationCoords: location.coords }),
        ...(scheduledAt && { scheduledAt: Timestamp.fromDate(new Date(scheduledAt)) })
      };

      await addDoc(feedCollectionRef, postData);
      clearForm();
      onPostSuccess?.();

    } catch (err) {
      console.error("Error creating post:", err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start space-x-3">
        <Avatar photoURL={currentUser.photoURL} displayName={currentUser.displayName} />
        <div className="w-full relative">
          <Textarea 
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="What's happening?"
            className="min-h-[100px] resize-none border-0 p-0 text-base focus-visible:ring-0"
          />
          {mentionSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-background shadow-lg rounded-md mt-1 border max-h-48 overflow-y-auto">
              <ul>
                {mentionSuggestions.map(user => (
                  <li 
                    key={user.uid} 
                    onMouseDown={(e) => {e.preventDefault(); handleMentionSelect(user);}} 
                    className="flex items-center p-3 hover:bg-muted cursor-pointer"
                  >
                    <Avatar photoURL={user.photoURL} displayName={user.displayName} size="sm" />
                    <span className="ml-2 text-sm font-medium">{user.displayName}</span>
                    {user.username && <span className="ml-2 text-sm text-muted-foreground">@{user.username}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {image && (
        <div className="mt-4 ml-12 relative w-32 h-32">
          <img src={image.dataUrl} alt="Preview" className="w-full h-full object-cover rounded-lg border"/>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {setImage(null); if(imageInputRef.current) imageInputRef.current.value = '';}}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
          >
            <Icon name="x" size={14}/>
          </Button>
        </div>
      )}
      
      {location && (
        <div className="text-xs text-muted-foreground ml-12 mt-2 flex items-center gap-1">
          <Icon name="location_on" size={12}/> 
          {location.name}
        </div>
      )}
      
      {isScheduleOpen && (
        <div className="ml-12 mt-2">
          <Input 
            type="datetime-local" 
            value={scheduledAt} 
            onChange={e => setScheduledAt(e.target.value)} 
            className="max-w-xs"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2 ml-12">{error}</p>}
      
      <div className="flex justify-between items-center mt-4 md:pl-12">
        <div className="flex items-center space-x-1 text-primary">
          <label htmlFor="composer-image-upload" className="cursor-pointer">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <span>
                <Icon name="image" size={18} />
              </span>
            </Button>
          </label>
          <input 
            id="composer-image-upload" 
            type="file" 
            ref={imageInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageSelect} 
          />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setScheduleOpen(prev => !prev)} 
            className="h-8 w-8 p-0"
          >
            <Icon name="schedule_post" size={18} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGetLocation} 
            className={`h-8 w-8 p-0 ${location ? 'bg-primary/10' : ''}`}
            disabled={isFetchingLocation}
          >
            <Icon name="location_on" size={18} />
          </Button>
          
          <div className="h-4 w-px bg-border mx-2"></div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('bold')} 
            className="h-8 w-8 p-0"
          >
            <Icon name="format_bold" size={18} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleFormat('italic')} 
            className="h-8 w-8 p-0"
          >
            <Icon name="format_italic" size={18} />
          </Button>
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={(!content.trim() && !image) || isSubmitting}
        >
          {scheduledAt ? 'Schedule' : 'Post'}
        </Button>
      </div>
    </Card>
  );
};

export default FeedComposer;