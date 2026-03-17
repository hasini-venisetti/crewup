'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { conversationAPI, searchAPI, messageRequestAPI } from '@/lib/api';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { Search, X, Send, Plus, ArrowLeft, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportModal from '@/components/ui/ReportModal';

// Navbar height offset
const NAV_H = 'calc(100vh - 60px)';

// Detect phone numbers or email addresses in a string
const CONTACT_RE = /(\+?\d[\d\s\-().]{7,}\d|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const socket = useSocket();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  // sidebar tab: 'chats' | 'requests'
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [msgRequests, setMsgRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const messagesEndRef = useRef(null);

  /* ─── helpers ────────────────────────────────────────────── */
  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await messageRequestAPI.getIncoming();
      setMsgRequests(res.data?.data || []);
    } catch { setMsgRequests([]); }
    finally { setLoadingRequests(false); }
  };

  const handleAcceptRequest = async (req) => {
    if (respondingId) return;
    setRespondingId(req._id);
    try {
      const res = await messageRequestAPI.accept(req._id);
      const conv = res.data?.data;
      setMsgRequests((prev) => prev.filter((r) => r._id !== req._id));
      if (conv) {
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          return exists ? prev : [conv, ...prev];
        });
        setSidebarTab('chats');
        setSelectedConvId(conv._id);
        setMobileView('chat');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to accept request.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeclineRequest = async (req) => {
    if (respondingId) return;
    setRespondingId(req._id);
    try {
      await messageRequestAPI.decline(req._id);
      setMsgRequests((prev) => prev.filter((r) => r._id !== req._id));
    } catch { /* silent */ }
    finally { setRespondingId(null); }
  };

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
      const warning = res.data?.warning;
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
              ? { ...c, lastMessage: newMsg.text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
      // Phase 3: Show scam/contact-info warning as a toast
      if (warning) toast(warning, { icon: '⚠️', duration: 6000, style: { background: '#fff8e8', border: '1px solid #f0d060', color: '#7a6000' } });
    } catch (err) {
      const errCode = err?.response?.data?.code;
      const errMsg  = err?.response?.data?.message || 'Failed to send message.';
      if (errCode === 'MINOR_PROTECTION') {
        toast.error(errMsg, { duration: 8000, icon: '🔒' });
      } else {
        toast.error(errMsg);
      }
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
    loadRequests();
    // Auto-switch to requests tab if URL says so
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'requests') setSidebarTab('requests');
      const conv = params.get('conv');
      if (conv) { setSelectedConvId(conv); setMobileView('chat'); }
    }
  }, [user]);

  useEffect(() => {
    if (sidebarTab === 'requests') loadRequests();
  }, [sidebarTab]);

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
        <div className="px-5 py-4 border-b border-[#efefed]">
          <h1 className="text-lg font-bold text-[#111110]">Messages</h1>
          <p className="text-xs text-[#a3a39e] mt-0.5">Visit a profile to send a message request</p>
        </div>

        {/* Tabs: Chats / Requests */}
        <div className="flex border-b border-[#efefed]">
          <button
            onClick={() => setSidebarTab('chats')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              sidebarTab === 'chats'
                ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]'
                : 'text-[#a3a39e] hover:text-[#6b6b66]'
            }`}
          >
            Chats
            {conversations.length > 0 && (
              <span className="ml-1.5 bg-[#f0eeff] text-[#6C63FF] px-1.5 py-0.5 rounded-full text-[10px]">
                {conversations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarTab('requests')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              sidebarTab === 'requests'
                ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]'
                : 'text-[#a3a39e] hover:text-[#6b6b66]'
            }`}
          >
            Requests
            {msgRequests.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {msgRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Requests tab ── */}
          {sidebarTab === 'requests' && (
            loadingRequests ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-[#f7f7f6] h-20" />)}
              </div>
            ) : msgRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-3xl mb-3">📩</p>
                <p className="text-sm font-semibold text-[#111110] mb-1">No pending requests</p>
                <p className="text-xs text-[#a3a39e]">Message requests from other users will appear here.</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {msgRequests.map((req) => (
                  <div key={req._id} className="rounded-xl border border-[#efefed] p-4 bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <Link href={`/profile/${req.sender?._id}`} className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9c4ff] to-[#6C63FF] flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                          {req.sender?.profileImage
                            ? <img src={req.sender.profileImage} alt="" className="w-full h-full object-cover" />
                            : req.sender?.name?.[0]?.toUpperCase()
                          }
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${req.sender?._id}`} className="text-sm font-semibold text-[#111110] hover:text-[#6C63FF] transition-colors">
                          {req.sender?.name}
                        </Link>
                        <p className="text-[11px] text-[#a3a39e]">{req.sender?.role}</p>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs text-[#6b6b66] bg-[#f7f7f6] rounded-lg px-3 py-2 mb-3 italic">"{req.message}"</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeclineRequest(req)}
                        disabled={respondingId === req._id}
                        className="flex-1 py-1.5 rounded-lg border border-[#e0e0dd] text-xs font-semibold text-[#6b6b66] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={respondingId === req._id}
                        className="flex-1 py-1.5 rounded-lg bg-[#6C63FF] hover:bg-[#5750D4] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {respondingId === req._id ? '…' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Chats tab ── */}
          {sidebarTab === 'chats' && (
            loadingConvs ? (
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
                <p className="text-sm text-[#a3a39e] mb-4">Send a message request from someone's profile to connect.</p>
              </div>
            )
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
            <div className="border-t border-[#efefed] bg-white flex-shrink-0">
              {/* Inline safety banner — shown only when typing contact info */}
              {CONTACT_RE.test(messageText) && (() => {
                const otherIsActor = selectedOtherUser?.role === 'actor';
                const selfIsActor  = user?.role === 'actor';
                return otherIsActor || selfIsActor ? (
                  <div className="mx-4 mt-3 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-base flex-shrink-0 mt-0.5">🔒</span>
                    <p className="text-xs text-red-700 leading-relaxed">
                      {selfIsActor
                        ? <><strong>Safety reminder:</strong> As an actor, avoid sharing personal contact details (phone/email) until after your first in-person meeting with this person.</>
                        : <><strong>Safety reminder:</strong> <span className="font-semibold capitalize">{selectedOtherUser?.name}</span> is an actor. For their safety, contact info will be removed from this message. Meet in person first before exchanging personal details.</>
                      }
                    </p>
                  </div>
                ) : (
                  <div className="mx-4 mt-3 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      <strong>Heads up:</strong> Only share personal contact details after you've met and built trust with this person. Connect on-platform first.
                    </p>
                  </div>
                );
              })()}
              <div className="px-4 py-3.5 flex gap-2 items-end">
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
  const [showReport, setShowReport] = useState(false);
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
    <div className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[72%] relative">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-[#6C63FF] text-white rounded-br-sm'
              : 'bg-white border border-[#e0e0dd] text-[#111110] rounded-bl-sm'
          }`}
        >
          {message.text || message.content}
        </div>
        {/* Report button — only on other people's messages */}
        {!isOwn && (
          <button
            onClick={() => setShowReport(true)}
            title="Report this message"
            className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[#c0c0bc] hover:text-red-500 text-sm leading-none"
          >
            ⚑
          </button>
        )}
        {time && (
          <p className={`text-[10px] text-[#a3a39e] mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {time}
          </p>
        )}
      </div>
    </div>
    {showReport && (
      <ReportModal
        targetType="message"
        targetId={message._id}
        targetLabel="this message"
        onClose={() => setShowReport(false)}
      />
    )}
    </>
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
