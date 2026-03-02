'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { messageAPI, userAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await messageAPI.getConversations();
      const data = res.data?.data || res.data?.conversations || [];
      setConversations(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConvs(false);
    }
  };

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    loadMessages();
  }, [selectedConvId]);

  const loadMessages = async () => {
    try {
      setLoadingMsgs(true);
      const res = await messageAPI.getMessages(selectedConvId);
      const data = res.data?.data || res.data?.messages || [];
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message:received', (message) => {
      if (message.conversationId === selectedConvId) {
        setMessages((prev) => [...prev, message]);
      }
      loadConversations();
    });

    socket.on('message:sent', (message) => {
      if (message.conversationId === selectedConvId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off('message:received');
      socket.off('message:sent');
    };
  }, [socket, selectedConvId]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConvId) return;

    try {
      await messageAPI.sendMessage(selectedConvId, {
        content: messageText,
        type: 'text',
      });
      setMessageText('');
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleComposeDone = async (recipientIds) => {
    setShowCompose(false);
    await loadConversations();
  };

  const getOtherUser = (conv) => {
    return conv.participants.find((p) => p.id !== user?.id);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation Sidebar */}
      <div className="w-full border-r border-[#efefed] sm:w-80 sm:flex-shrink-0 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-[#efefed] bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#111110]">
              Messages
            </h1>
            <button
              onClick={() => setShowCompose(true)}
              className="rounded-lg bg-[#0e0e0d] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2d2d2b]"
            >
              New
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-gray-100 p-4">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-1 p-4 sm:p-6">
              {conversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                const isActive = selectedConvId === conv.id;
                return (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    otherUser={otherUser}
                    isActive={isActive}
                    onClick={() => setSelectedConvId(conv.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <div className="mb-3 text-4xl text-amber-500">✦</div>
                <p className="text-sm text-gray-600">No conversations yet. Start a new one!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Pane */}
      {selectedConvId ? (
        <div className="hidden sm:flex sm:w-0 sm:flex-1 sm:flex-col">
          {/* Chat Header */}
          <div className="border-b border-[#efefed] bg-white px-6 py-4">
            {conversations.find((c) => c.id === selectedConvId) && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-sm font-semibold text-amber-800">
                  {getOtherUser(conversations.find((c) => c.id === selectedConvId))?.name?.[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-[#111110]">
                    {getOtherUser(conversations.find((c) => c.id === selectedConvId))?.name}
                  </h2>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {loadingMsgs ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`mb-4 h-8 w-3/5 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-[#efefed] bg-white px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-[#e0e0dd] bg-white px-4 py-3 text-sm text-[#111110] placeholder-gray-400 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                onClick={sendMessage}
                disabled={!messageText.trim()}
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex sm:w-0 sm:flex-1 sm:flex-col sm:items-center sm:justify-center"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        >
          <div
            className="rounded-2xl bg-[#0e0e0d] px-12 py-16 text-center"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          >
            <div className="mb-4 text-5xl text-amber-500">✦</div>
            <h2 className="font-['Playfair_Display'] mb-2 text-2xl font-bold text-white">
              Select a Conversation
            </h2>
            <p className="text-gray-400">Choose a conversation from the list to start messaging.</p>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onDone={handleComposeDone}
        />
      )}
    </div>
  );
}

function ConversationItem({ conv, otherUser, isActive, onClick }) {
  if (!otherUser) return null;

  const lastMessage = conv.lastMessage?.content || 'No messages yet';
  const initials = otherUser.name?.charAt(0) || '?';

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left transition-all ${
        isActive
          ? 'border-l-4 border-l-amber-500 border-r-[#efefed] border-t-[#efefed] border-b-[#efefed] bg-amber-50'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-sm font-semibold text-amber-800">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isActive ? 'text-amber-900' : 'text-[#111110]'}`}>
            {otherUser.name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {lastMessage}
          </p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs rounded-2xl px-4 py-3 text-sm ${
          isOwn
            ? 'rounded-br-sm bg-[#0e0e0d] text-white'
            : 'rounded-bl-sm border border-[#efefed] bg-white text-[#111110]'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function ComposeModal({ onClose, onDone }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setIsSearching(true);
        const res = await userAPI.search({ q: searchQuery });
        const data = res.data?.data || res.data?.users || [];
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const res = await messageAPI.createConversation({
        participantIds: selectedUsers.map((u) => u.id),
      });
      onDone(selectedUsers.map((u) => u.id));
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-['Playfair_Display'] mb-4 text-2xl font-bold text-[#111110]">
          Start a Conversation
        </h2>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1"
              >
                <span className="text-sm font-medium text-amber-900">{user.name}</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-amber-600 hover:text-amber-900"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl border border-[#e0e0dd] bg-white px-4 py-3 text-sm text-[#111110] placeholder-gray-400 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Search Results */}
        {isSearching ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-10" />
            ))}
          </div>
        ) : (
          <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                disabled={selectedUsers.find((u) => u.id === user.id)}
                className="w-full rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-[#111110]">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#efefed] px-4 py-2.5 text-sm font-semibold text-[#111110] transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStartConversation}
            disabled={selectedUsers.length === 0}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
