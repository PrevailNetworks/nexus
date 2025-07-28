import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import type { FeedPost, AppUser } from '../../types';
import { Role, FIRESTORE_COLLECTIONS } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/avatar';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FeedPostCardProps {
  post: FeedPost;
  currentUser: AppUser;
  usersMap: Map<string, AppUser>;
  onReply: (post: FeedPost) => void;
  allRepliesMap: Record<string, FeedPost[]>;
  isReply?: boolean;
}

const FeedPostCard: React.FC<FeedPostCardProps> = ({ 
  post, 
  currentUser, 
  usersMap, 
  onReply, 
  allRepliesMap, 
  isReply = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReactPickerOpen, setReactPickerOpen] = useState(false);

  const author = usersMap.get(post.authorId);
  const canEdit = currentUser.uid === post.authorId;
  const canDelete = currentUser.uid === post.authorId || currentUser.role === Role.ADMIN;
  const postRef = doc(firestore, `organizations/${currentUser.organizationId}/${FIRESTORE_COLLECTIONS.FEED}`, post.id);
  const replies = allRepliesMap[post.id] || [];

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    setIsProcessing(true);
    try {
      await updateDoc(postRef, {
        content: editedContent,
        lastEditedAt: new Date(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating post:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteDoc(postRef);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting post:", err);
      setIsProcessing(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    setReactPickerOpen(false);
    const currentReactions = post.reactions || {};
    const usersForEmoji = currentReactions[emoji] || [];

    const newUsersForEmoji = usersForEmoji.includes(currentUser.uid)
      ? usersForEmoji.filter((uid) => uid !== currentUser.uid)
      : [...usersForEmoji, currentUser.uid];

    const newReactions = { ...currentReactions, [emoji]: newUsersForEmoji };

    if (newReactions[emoji].length === 0) {
      delete newReactions[emoji];
    }
    
    await updateDoc(postRef, { reactions: newReactions });
  };

  const timestamp = post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now';

  return (
    <>
      <Card className={isReply ? 'border-0 shadow-none p-4' : 'p-6'}>
        <div className="flex items-start space-x-3">
          <Avatar photoURL={author?.photoURL} displayName={author?.displayName} size="sm" />
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{author?.displayName || 'Unknown User'}</span>
                <span className="text-xs text-muted-foreground">
                  {timestamp}
                  {post.lastEditedAt && ' (edited)'}
                </span>
                {post.locationName && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Icon name="location_on" size={12} /> 
                    {post.locationName}
                  </span>
                )}
              </div>
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Icon name="more_horiz" size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Icon name="edit" size={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Icon name="delete" size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveEdit} 
                    disabled={isProcessing || !editedContent.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.content}
                  </ReactMarkdown>
                </div>
                
                {post.scheduledAt && (
                  <div className="mt-2 text-xs text-muted-foreground italic flex items-center gap-1">
                    <Icon name="schedule_post" size={12}/>
                    Scheduled for {post.scheduledAt.toDate().toLocaleString()}
                  </div>
                )}

                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Feed post attachment" 
                    className="mt-3 rounded-lg border max-h-80 object-cover" 
                  />
                )}
                
                {Object.keys(post.reactions || {}).length > 0 && (
                  <div className="mt-3 flex items-center flex-wrap gap-2">
                    {Object.entries(post.reactions || {}).map(([emoji, userIds]) =>
                      userIds.length > 0 ? (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors border ${
                            userIds.includes(currentUser.uid)
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted border-border hover:bg-muted/80'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-medium">{userIds.length}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReactPickerOpen(!isReactPickerOpen)}
                    className="h-8 px-2"
                  >
                    <Icon name="thumb_up" size={16} className="mr-1"/>
                    React
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(post)}
                    className="h-8 px-2"
                  >
                    <Icon name="chat_bubble" size={16} className="mr-1"/>
                    Reply
                  </Button>
                  {(post.replyCount || 0) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>

                {replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                    {replies.map(reply => (
                      <FeedPostCard 
                        key={reply.id} 
                        post={reply} 
                        currentUser={currentUser} 
                        usersMap={usersMap} 
                        onReply={onReply}
                        allRepliesMap={allRepliesMap}
                        isReply={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete this post? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)} 
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isProcessing}
            >
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedPostCard;