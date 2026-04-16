/**
 * useFriends
 *
 * Manages friends list, search, and friend requests.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  friendsApi,
  type FriendWithStats,
  type FriendSearchResult,
} from '@/api/client';
import { useUser } from './useUser';

interface UseFriendsResult {
  friends: FriendWithStats[];
  pendingRequests: any[];
  searchResults: FriendSearchResult[];
  loadingFriends: boolean;
  loadingSearch: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sendRequest: (receiverId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  removeOrDecline: (requestId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFriends(): UseFriendsResult {
  const { userId } = useUser();
  const [friends, setFriends] = useState<FriendWithStats[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    setLoadingFriends(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendsApi.getFriends(userId),
        friendsApi.getPendingRequests(userId),
      ]);
      if (friendsRes.data) setFriends(friendsRes.data);
      if (requestsRes.data) setPendingRequests(requestsRes.data);
    } catch {
      // silent — offline or server error
    } finally {
      setLoadingFriends(false);
    }
  }, [userId]);

  const setSearchQuery = useCallback(
    async (q: string) => {
      setSearchQueryState(q);
      if (!userId || q.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const res = await friendsApi.search(q, userId);
        if (res.data) setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    },
    [userId],
  );

  const sendRequest = useCallback(
    async (receiverId: string) => {
      if (!userId) return;
      await friendsApi.sendRequest(userId, receiverId);
      // Optimistically mark in search results
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === receiverId ? { ...u, friendStatus: 'PENDING' } : u,
        ),
      );
    },
    [userId],
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!userId) return;
      await friendsApi.acceptRequest(requestId, userId);
      await loadFriends();
    },
    [userId, loadFriends],
  );

  const removeOrDecline = useCallback(
    async (requestId: string) => {
      if (!userId) return;
      await friendsApi.removeOrDecline(requestId, userId);
      await loadFriends();
    },
    [userId, loadFriends],
  );

  const refresh = useCallback(async () => {
    await loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  return {
    friends,
    pendingRequests,
    searchResults,
    loadingFriends,
    loadingSearch,
    searchQuery,
    setSearchQuery,
    sendRequest,
    acceptRequest,
    removeOrDecline,
    refresh,
  };
}
