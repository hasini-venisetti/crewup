'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { conversationAPI, searchAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Search, X, Send, Plus, ArrowLeft, MoreVertical } from 'lucide-react';

// Navbar height offset
const NAV_H = 'calc(100vh - 60px)';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);

  /* ─── helpers (defined before useEffect so const hoisting isn't an issue) ── */
  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const loadConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await conversationAPI.getAll();
      const data = res.data?.data || res.data?.conversations || [];
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      if (list.length > 0 && !selectedConvId) {
        setSelectedConvId(list[0]._id);
      }
    } catch (err) {
      console.error('loadConversations:', err);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMsgs(true);
      const res = await conversationAPI.getMessages(selectedConvId);
      const data = res.data?.data || res.data?.messages || [];
      setMessages(Array.isArray(data) ? data : []);
      scrollToBottom();
    } catch (err) {
      console.error('loadMessages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedConvId) return;
    setMessageText('');
    try {
      const res = await conversationAPI.sendMessage({
        conversationId: selectedConvId,
        text,
      });
      const newMsg = res.data?.data;
      if (newMsg) {
        setMessages((prev) => {
          const exists = prev.some((m) => (m._id || m.id) === (newMsg._id || newMsg.id));
          return exists ? prev : [...prev, newMsg];
        });
        scrollToBottom();
        // Update sidebar preview without reloading all conversations
        setConversations((prev) =>
          prev.map((c) =>
            (c._id || c.id) === selectedConvId
              ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('sendMessage:', err);
      setMessageText(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ─── effects ──────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConvId) return;
    loadMessages();
  }, [selectedConvId]);

  useEffect(() => {
    if (!socket || !selectedConvId) return;
    const handleNewMessage = (msg) => {
      if (msg.conversationId === selectedConvId) {
        setMessages((prev) => {
          const exists = prev.some((m) => (m._id || m.id) === (msg._id || msg.id));
          return exists ? prev : [...prev, msg];
        });
        scrollToBottom();
      }
      // Update sidebar preview in-place — no full refetch needed
      setConversations((prev) =>
        prev.map((c) =>
          (c._id || c.id) === msg.conversationId
            ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt }
            : c
        )
      );
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedConvId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center bg-[#fafaf9]" style={{ height: NAV_H }}>
        <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center bg-[#fafaf9]" style={{ height: NAV_H }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#111110] mb-2">Sign in required</h2>
          <p className="text-[#6b6b66] mb-4">Please log in to access your messages.</p>
          <a href="/login" className="inline-block bg-[#6C63FF] text-white px-6 py-2 rounded-lg hover:bg-[#5750D4] transition-colors">
            Log In
          </a>
        </div>
      </div>
    );
  }

  const handleComposeDone = async (recipientIds) => {
    setShowCompose(false);
    await loadConversations();
    try {
      const res = await conversationAPI.getAll();
      const list = res.data?.data || res.data?.conversations || [];
      const newConv = list.find((conv) => {
        if (!Array.isArray(conv.members)) return false;
        const ids = conv.members.map((p) => (p._id || p.id)?.toString());
        return recipientIds.every((id) => ids.includes(id?.toString()));
      });
      if (newConv) {
        setSelectedConvId(newConv._id);
        setMobileView('chat');
      }
    } catch {}
  };

  const selectConversation = (id) => {
    setSelectedConvId(id);
    setMobileView('chat');
  };

  const getOtherUser = (conv) => {
    if (!conv?.members || !Array.isArray(conv.members)) return null;
    return conv.members.find(
      (p) => (p._id || p.id)?.toString() !== (user?._id || user?.id)?.toString()
    );
  };

  const selectedConv = conversations.find((c) => (c._id || c.id) === selectedConvId);
  const selectedOtherUser = selectedConv ? getOtherUser(selectedConv) : null;

  /* ─── render ───────────────────────────────────── */
  return (
    <div className="flex bg-[#fafaf9] overflow-hidden" style={{ height: NAV_H }}>

      {/* ── Sidebar ─────────────────────────────── */}
      <div className={`
        flex-shrink-0 flex flex-col bg-white border-r border-[#efefed]
        w-full sm:w-80
        ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}
      `}>
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-[#efefed] flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#111110]">Messages</h1>
            <p className="text-xs text-[#a3a39e] mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 bg-[#6C63FF] hover:bg-[#5750D4] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> New
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#efefed]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39e]" size={15} />
            <input
              type="text"
              placeholder="Search conversations…"
              className="w-full pl-9 pr-4 py-2 bg-[#f7f7f6] border border-[#e0e0dd] rounded-lg text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-2 p-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-[#f7f7f6] h-16" />
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="p-2 space-y-0.5">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                if (!other) return null;
                const cid = conv._id || conv.id;
                return (
                  <ConversationItem
                    key={cid}
                    conv={conv}
                    otherUser={other}
                    isActive={selectedConvId === cid}
                    onClick={() => selectConversation(cid)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 bg-[#f0eeff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="text-[#6C63FF]" size={22} />
              </div>
              <p className="font-semibold text-[#111110] mb-1">No conversations yet</p>
              <p className="text-sm text-[#a3a39e] mb-4">Start messaging creators you want to work with.</p>
              <button
                onClick={() => setShowCompose(true)}
                className="inline-flex items-center gap-2 bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={15} /> New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Pane ───────────────────────────── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}
      `}>
        {selectedConvId && selectedOtherUser ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-[#efefed] bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile back */}
                <button
                  onClick={() => setMobileView('list')}
                  className="sm:hidden p-1 -ml-1 text-[#6b6b66] hover:text-[#111110]"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {selectedOtherUser.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-[#111110] text-sm">{selectedOtherUser.name}</p>
                  <p className="text-xs text-[#a3a39e] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Active
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-[#f7f7f6] rounded-lg transition-colors">
                <MoreVertical size={17} className="text-[#6b6b66]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-[#fafaf9] px-5 py-5">
              {loadingMsgs ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                      <div className="animate-pulse rounded-2xl bg-[#efefed] h-10 w-48" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-3xl mb-3">💬</div>
                  <p className="text-sm font-medium text-[#111110] mb-1">Start the conversation</p>
                  <p className="text-xs text-[#a3a39e]">Say hello to {selectedOtherUser.name}!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id || msg._id}
                      message={msg}
                      isOwn={msg.senderId === user?.id || msg.sender?._id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3.5 border-t border-[#efefed] bg-white flex-shrink-0">
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 rounded-xl border border-[#e0e0dd] bg-[#f7f7f6] px-4 py-3 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] disabled:bg-[#efefed] disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 bg-[#f0eeff] rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#6C63FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-[Playfair_Display] font-bold text-[#111110] mb-2">Select a conversation</h2>
            <p className="text-sm text-[#a3a39e] mb-6 max-w-xs">Choose from your conversations or start a new one.</p>
            <button
              onClick={() => setShowCompose(true)}
              className="inline-flex items-center gap-2 bg-[#6C63FF] hover:bg-[#5750D4] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> New Conversation
            </button>
          </div>
        )}
      </div>

      {/* ── Compose Modal ───────────────────────── */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onDone={handleComposeDone}
        />
      )}
    </div>
  );
}

/* ─── ConversationItem ──────────────────────── */
function ConversationItem({ conv, otherUser, isActive, onClick }) {
  // lastMessage is stored as a plain string on the Conversation document
  const lastMsg = typeof conv.lastMessage === 'string'
    ? conv.lastMessage
    : conv.lastMessage?.text || conv.lastMessage?.content || 'No messages yet';
  const initial = otherUser.name?.charAt(0)?.toUpperCase() || '?';
  const time = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const unread = conv.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-3 text-left transition-all ${
        isActive ? 'bg-[#f0eeff] border-l-[3px] border-[#6C63FF]' : 'hover:bg-[#f7f7f6]'
      }`}
    >
      <div className="flex gap-3 items-center">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-sm font-bold">
            {initial}
          </div>
          {unread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6C63FF] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-sm truncate ${unread ? 'font-bold text-[#111110]' : 'font-medium text-[#111110]'}`}>
              {otherUser.name}
            </p>
            {time && <span className="text-[10px] text-[#a3a39e] flex-shrink-0 ml-2">{time}</span>}
          </div>
          <p className={`text-xs truncate ${unread ? 'text-[#111110]' : 'text-[#a3a39e]'}`}>
            {lastMsg}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ─── MessageBubble ─────────────────────────── */
function MessageBubble({ message, isOwn }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[72%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-[#6C63FF] text-white rounded-br-sm'
              : 'bg-white border border-[#e0e0dd] text-[#111110] rounded-bl-sm'
          }`}
        >
          {message.text || message.content}
        </div>
        {time && (
          <p className={`text-[10px] text-[#a3a39e] mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {time}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── ComposeModal ──────────────────────────── */
function ComposeModal({ onClose, onDone }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) { setUsers([]); return; }
    const t = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchAPI.search({ q: searchQuery, type: 'creators' });
        const data = res.data?.data?.creators || res.data?.creators || [];
        setUsers(Array.isArray(data) ? data : []);
      } catch { setUsers([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const toggle = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x._id === u._id) ? prev.filter((x) => x._id !== u._id) : [...prev, u]
    );
    setSearchQuery('');
  };

  const startConversation = async () => {
    if (selectedUsers.length === 0) return;
    try {
      // backend expects { recipientId } for 1-to-1, or { recipientIds } for group
      const payload = selectedUsers.length === 1
        ? { recipientId: selectedUsers[0]._id }
        : { recipientIds: selectedUsers.map((u) => u._id) };
      await conversationAPI.start(payload);
      onDone(selectedUsers.map((u) => u._id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#efefed]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefed]">
          <h2 className="text-lg font-bold text-[#111110]">New Conversation</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f7f7f6] rounded-lg transition-colors">
            <X size={18} className="text-[#6b6b66]" />
          </button>
        </div>

        <div className="p-5">
          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUsers.map((u) => (
                <span key={u._id} className="inline-flex items-center gap-1.5 bg-[#f0eeff] border border-[#6C63FF]/20 text-[#5750D4] text-xs font-semibold rounded-full px-3 py-1">
                  {u.name}
                  <button onClick={() => toggle(u)} className="hover:text-[#111110]">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39e]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators by name…"
              className="w-full pl-9 pr-4 py-3 border border-[#e0e0dd] rounded-xl bg-[#f7f7f6] text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF]"
            />
          </div>

          {/* Results */}
          <div className="max-h-48 overflow-y-auto mb-4 space-y-0.5">
            {isSearching ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded-xl bg-[#f7f7f6]" />
              ))
            ) : users.length > 0 ? (
              users.map((u) => {
                const selected = !!selectedUsers.find((x) => x._id === u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggle(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      selected ? 'bg-[#f0eeff]' : 'hover:bg-[#f7f7f6]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111110] truncate">{u.name}</p>
                      <p className="text-xs text-[#a3a39e] truncate capitalize">{u.role?.replace('-', ' ')}</p>
                    </div>
                    {selected && <span className="text-[#6C63FF] text-xs font-semibold">✓</span>}
                  </button>
                );
              })
            ) : searchQuery.trim() ? (
              <p className="text-center text-sm text-[#a3a39e] py-4">No creators found for "{searchQuery}"</p>
            ) : (
              <p className="text-center text-xs text-[#a3a39e] py-4">Type a name to search creators</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#e0e0dd] px-4 py-2.5 text-sm font-semibold text-[#6b6b66] hover:bg-[#f7f7f6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startConversation}
              disabled={selectedUsers.length === 0}
              className="flex-1 rounded-xl bg-[#6C63FF] hover:bg-[#5750D4] disabled:bg-[#efefed] disabled:text-[#a3a39e] disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
