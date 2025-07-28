import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { FeedPost, AppUser, Team } from '../types';
import { FIRESTORE_COLLECTIONS } from '../types';
import { LoadingSpinner } from '../components/ui/loading';
import FeedComposer from '../components/feed/FeedComposer';
import FeedPostCard from '../components/feed/FeedPostCard';
import { Button } from '../components/ui/button';

const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const appUser = user as AppUser | null;
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, AppUser>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repliesMap] = useState<Record<string, FeedPost[]>>({});

  const fetchUsers = useCallback(async () => {
    if (!appUser?.organizationId) return;
    
    try {
      const usersQuery = query(
        collection(firestore, FIRESTORE_COLLECTIONS.USERS),
        where('organizationId', '==', appUser.organizationId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
      
      setAllUsers(users);
      setUsersMap(new Map(users.map(user => [user.uid, user])));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [appUser?.organizationId]);

  const fetchTeams = useCallback(async () => {
    if (!appUser?.organizationId) return;
    
    try {
      const teamsQuery = query(
        collection(firestore, `organizations/${appUser.organizationId}/${FIRESTORE_COLLECTIONS.TEAMS}`)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      
      setAllTeams(teams);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }, [appUser?.organizationId]);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!appUser?.organizationId) return;
    
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const feedCollectionRef = collection(firestore, `organizations/${appUser.organizationId}/${FIRESTORE_COLLECTIONS.FEED}`);
      
      let postsQuery = query(
        feedCollectionRef,
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (loadMore && posts.length > 0) {
        const lastPost = posts[posts.length - 1];
        postsQuery = query(
          feedCollectionRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastPost.createdAt),
          limit(10)
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const newPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
      
      if (loadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10);
      
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load feed posts.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [appUser?.organizationId, posts]);

  useEffect(() => {
    if (appUser?.organizationId) {
      fetchUsers();
      fetchTeams();
      fetchPosts();
    }
  }, [appUser?.organizationId]);

  const handlePostSuccess = () => {
    fetchPosts(); // Refresh feed after posting
  };

  const handleReply = (post: FeedPost) => {
    // TODO: Implement reply functionality
    console.log('Reply to post:', post.id);
  };

  const handleLoadMore = () => {
    fetchPosts(true);
  };

  if (!appUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchPosts()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FeedComposer 
        currentUser={appUser}
        allUsers={allUsers}
        allTeams={allTeams}
        onPostSuccess={handlePostSuccess}
      />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUser={appUser}
                  usersMap={usersMap}
                  onReply={handleReply}
                  allRepliesMap={repliesMap}
                />
              ))}
              
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedPage;