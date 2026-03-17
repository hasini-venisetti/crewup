'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { projectAPI, conversationAPI, taskAPI, teamFileAPI, timelineAPI, scheduleAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/* ─────────────── constants ─────────────── */
const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  medium: { label: 'Medium', dot: 'bg-[#6C63FF]',  text: 'text-[#5750D4]',  bg: 'bg-[#f0eeff] border-[#c9c4ff]' },
  low:    { label: 'Low',    dot: 'bg-green-500',  text: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
};
const STATUS_COLS = [
  { key: 'todo',        label: 'To Do',       icon: '📋', count_class: 'bg-gray-100 text-gray-600' },
  { key: 'in-progress', label: 'In Progress', icon: '⚡', count_class: 'bg-[#e4e1ff] text-[#4740CC]' },
  { key: 'done',        label: 'Done',        icon: '✅', count_class: 'bg-green-100 text-green-700' },
];
const TIMELINE_STAGES = ['planning','pre-production','production','post-production','released'];
const STAGE_LABELS = {
  planning:          { label: 'Planning',        icon: '📋' },
  'pre-production':  { label: 'Pre-Production',  icon: '📝' },
  production:        { label: 'Production',      icon: '🎬' },
  'post-production': { label: 'Post-Production', icon: '✂️' },
  released:          { label: 'Released',        icon: '🚀' },
};
const FILE_TYPE_CONFIG = {
  'link':         { icon: '🔗', label: 'Link' },
  'google-drive': { icon: '📂', label: 'Google Drive' },
  'dropbox':      { icon: '📦', label: 'Dropbox' },
  'notion':       { icon: '📓', label: 'Notion' },
  'figma':        { icon: '🎨', label: 'Figma' },
  'image':        { icon: '🖼️', label: 'Image' },
  'video':        { icon: '🎬', label: 'Video' },
  'doc':          { icon: '📄', label: 'Document' },
  'other':        { icon: '📁', label: 'File' },
};

/* ─────────────── helpers ─────────────── */
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-[#f0ede8] text-[#111110] font-bold flex items-center justify-center flex-shrink-0 uppercase`}>
      {name?.[0] || '?'}
    </div>
  );
}

/* ─────────────── MEMBERS BAR (DM row) ─────────────── */
function MembersBar({ project, user }) {
  const router = useRouter();

  const startDM = async (memberId) => {
    if (memberId === (user?._id || user?.id)) return;
    try {
      const { data } = await conversationAPI.start({ userId: memberId });
      const convId = data.data?._id;
      router.push(convId ? `/messages?conv=${convId}` : '/messages');
    } catch {
      router.push('/messages');
    }
  };

  const allMembers = [
    { user: project.createdBy, role: 'Owner' },
    ...(project.teamMembers || []).map((m) => ({ user: m.user, role: m.role })),
  ].filter((m) => m.user?._id);

  return (
    <div className="border-b border-[#efefed] bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-[#a3a39e] font-semibold mb-2">Team members</p>
      <div className="flex gap-3 flex-wrap">
        {allMembers.map(({ user: member, role }) => {
          const isMe = member._id === (user?._id || user?.id);
          return (
            <div key={member._id} className="flex items-center gap-2 bg-[#f7f7f6] border border-[#efefed] px-3 py-1.5 rounded-full">
              <div className="w-5 h-5 rounded-full bg-[#e0e0dd] flex items-center justify-center text-[9px] font-bold text-[#111110] flex-shrink-0 uppercase">
                {member.name?.[0] || '?'}
              </div>
              <span className="text-xs text-[#111110] font-medium">{member.name}</span>
              <span className="text-[10px] text-[#a3a39e]">{role}</span>
              {!isMe && (
                <button
                  onClick={() => startDM(member._id)}
                  className="text-[10px] text-white bg-[#111110] hover:bg-[#333] px-2 py-0.5 rounded-full transition-colors ml-1"
                  title={`Message ${member.name}`}
                >
                  DM
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── CHAT TAB ─────────────── */
function ChatTab({ project, user }) {
  const [chat, setChat]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const socketRef = useRef(null);
  const endRef    = useRef(null);

  // Load project chat
  useEffect(() => {
    conversationAPI.getProjectChat(project._id)
      .then(({ data }) => {
        setChat(data.data);
        return conversationAPI.getProjectMsgs(project._id);
      })
      .then(({ data }) => setMessages(data.data || []))
      .catch(() => toast.error('Failed to load team chat'))
      .finally(() => setLoading(false));
  }, [project._id]);

  // Socket.io connection
  useEffect(() => {
    if (!chat) return;
    const token = localStorage.getItem('crewup_token');
    if (!token) return;

    const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace('/api', '');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinProjectRoom', { projectChatId: chat._id });
    });

    socket.on('newProjectMessage', (msg) => {
      setMessages((prev) => {
        // Replace optimistic message (same text + sender) or skip duplicate real message
        const filtered = prev.filter((m) =>
          !(m._id?.toString().startsWith('opt_') &&
            m.text === msg.text &&
            (m.sender?._id || m.sender)?.toString() === (msg.sender?._id || msg.sender)?.toString())
        );
        if (filtered.find((m) => m._id === msg._id)) return filtered;
        return [...filtered, msg];
      });
    });

    socket.on('error', (err) => {
      console.error('Project chat socket error:', err?.message);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [chat]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const msgText = text.trim();
    if (!msgText || !socketRef.current || !chat) return;
    setSending(true);
    setText('');
    // Optimistically add the message so sender sees it immediately
    const optimistic = {
      _id: `opt_${Date.now()}`,
      text: msgText,
      sender: { _id: user?._id || user?.id, name: user?.name, profileImage: user?.profileImage },
      createdAt: new Date().toISOString(),
      projectChatId: chat._id,
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current.emit('sendProjectMessage', { projectChatId: chat._id, text: msgText });
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  const myId = user?._id || user?.id;

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[480px]">
      {/* Team members + DM buttons */}
      <MembersBar project={project} user={user} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#fafaf9]">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm font-medium text-[#111110] mb-1">Start the conversation</p>
            <p className="text-xs text-[#a3a39e]">Chat with your team about the project</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?._id === myId || msg.sender?._id?.toString() === myId;
            const showAvatar = i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id;
            return (
              <div key={msg._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                  <Avatar name={msg.sender?.name} image={msg.sender?.profileImage} size="sm" />
                </div>
                <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <span className="text-xs text-[#a3a39e] px-1">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#111110] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white border border-[#efefed] text-[#111110] rounded-2xl rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#a3a39e] px-1">{timeAgo(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#efefed] bg-white p-4">
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-shrink-0">
            <Avatar name={user?.name} size="sm" />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message your team..."
              className="flex-1 bg-[#f7f7f6] border border-[#e0e0dd] px-4 py-2.5 text-sm text-[#111110] placeholder:text-[#a3a39e] focus:outline-none focus:border-[#111110] transition-colors"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="bg-[#111110] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── TASK CARD ─────────────── */
function TaskCard({ task, teamMembers, onUpdate, onDelete, projectId, isOwner }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editForm, setEditForm] = useState({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', assignee: task.assignee?._id || '' });
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const moveNext = async () => {
    const order = ['todo', 'in-progress', 'done'];
    const idx = order.indexOf(task.status);
    if (idx >= order.length - 1) return;
    const next = order[idx + 1];
    await onUpdate(task._id, { status: next });
  };

  const movePrev = async () => {
    const order = ['todo', 'in-progress', 'done'];
    const idx = order.indexOf(task.status);
    if (idx <= 0) return;
    const prev = order[idx - 1];
    await onUpdate(task._id, { status: prev });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    await onUpdate(task._id, { ...editForm, assignee: editForm.assignee || null, dueDate: editForm.dueDate || null });
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="bg-white border border-[#efefed] hover:border-[#d0d0cd] transition-all p-4 flex flex-col gap-3">
      {/* Priority dot + header */}
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${p.dot}`} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full text-sm font-semibold text-[#111110] border border-[#e0e0dd] px-2 py-1 focus:outline-none focus:border-[#111110]"
              autoFocus />
          ) : (
            <p className={`text-sm font-semibold text-[#111110] ${task.status === 'done' ? 'line-through text-[#a3a39e]' : ''}`}>
              {task.title}
            </p>
          )}
          {task.assignee && (
            <p className="text-xs text-[#a3a39e] mt-0.5 flex items-center gap-1">
              <span>→</span> {task.assignee.name}
            </p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-[#a3a39e] hover:text-[#111110] text-xs flex-shrink-0 ml-1">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Due date */}
      {task.dueDate && !editing && (
        <p className="text-xs text-[#a3a39e] flex items-center gap-1">
          📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-[#f0f0ee] pt-3">
          {editing ? (
            <>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add description..." rows={3}
                className="w-full text-xs text-[#6b6b66] border border-[#e0e0dd] px-2 py-1.5 resize-none focus:outline-none focus:border-[#111110]" />
              <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="text-xs border border-[#e0e0dd] px-2 py-1.5 focus:outline-none text-[#111110]">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select value={editForm.assignee} onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                className="text-xs border border-[#e0e0dd] px-2 py-1.5 focus:outline-none text-[#111110]">
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                ))}
              </select>
              <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="text-xs border border-[#e0e0dd] px-2 py-1.5 focus:outline-none text-[#111110]" />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 text-xs font-semibold bg-[#111110] text-white py-1.5 disabled:opacity-50">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="flex-1 text-xs border border-[#e0e0dd] py-1.5 text-[#6b6b66]">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {task.description && <p className="text-xs text-[#6b6b66] leading-relaxed">{task.description}</p>}
              <div className="flex gap-2 flex-wrap">
                {task.status !== 'todo' && (
                  <button onClick={movePrev} className="text-xs text-[#6b6b66] border border-[#e0e0dd] px-2 py-1 hover:border-[#111110] hover:text-[#111110] transition-colors">
                    ← Back
                  </button>
                )}
                {task.status !== 'done' && (
                  <button onClick={moveNext} className="text-xs font-semibold bg-[#111110] text-white px-2 py-1 hover:bg-[#333] transition-colors">
                    Move Forward →
                  </button>
                )}
                <button onClick={() => setEditing(true)} className="text-xs text-[#6b6b66] border border-[#e0e0dd] px-2 py-1 hover:border-[#111110] transition-colors">
                  Edit
                </button>
                {isOwner && (
                  <button onClick={() => onDelete(task._id)} className="text-xs text-red-400 hover:text-red-600 border border-transparent hover:border-red-200 px-2 py-1 transition-colors">
                    Delete
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#a3a39e]">Added {timeAgo(task.createdAt)} by {task.createdBy?.name}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────── TASKS TAB ─────────────── */
function TasksTab({ project, user }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(null); // column key
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
  const [saving,  setSaving]  = useState(false);
  const isOwner = project.createdBy?._id === (user?._id || user?.id);
  const teamMembers = [
    { user: project.createdBy, role: 'Owner' },
    ...(project.teamMembers || []),
  ].filter((m) => m.user);

  useEffect(() => {
    taskAPI.getAll(project._id)
      .then(({ data }) => setTasks(data.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [project._id]);

  const handleCreate = async (status) => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await taskAPI.create(project._id, {
        ...newTask, status,
        assignee: newTask.assignee || null,
        dueDate:  newTask.dueDate  || null,
      });
      setTasks((prev) => [data.data, ...prev]);
      setNewTask({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
      setAdding(null);
      toast.success('Task created!');
    } catch { toast.error('Failed to create task'); }
    finally   { setSaving(false); }
  };

  const handleUpdate = async (taskId, updates) => {
    try {
      const { data } = await taskAPI.update(project._id, taskId, updates);
      setTasks((prev) => prev.map((t) => t._id === taskId ? data.data : t));
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async (taskId) => {
    try {
      await taskAPI.delete(project._id, taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="p-4">
      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm text-[#6b6b66]">
        <span>{tasks.length} total</span>
        <span>·</span>
        <span className="text-[#5750D4]">{tasks.filter((t) => t.status !== 'done').length} open</span>
        <span>·</span>
        <span className="text-green-600">{tasks.filter((t) => t.status === 'done').length} done</span>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span>{col.icon}</span>
                  <span className="text-sm font-bold text-[#111110]">{col.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.count_class}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button onClick={() => setAdding(adding === col.key ? null : col.key)}
                  className="text-xs text-[#6b6b66] hover:text-[#111110] border border-[#e0e0dd] hover:border-[#111110] w-6 h-6 flex items-center justify-center transition-colors">
                  +
                </button>
              </div>

              {/* Add task inline form */}
              {adding === col.key && (
                <div className="bg-white border border-[#111110] p-3 flex flex-col gap-2">
                  <input autoFocus value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title..." className="text-sm text-[#111110] border border-[#e0e0dd] px-2 py-1.5 focus:outline-none focus:border-[#111110] w-full"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(col.key); if (e.key === 'Escape') setAdding(null); }} />
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="text-xs border border-[#e0e0dd] px-2 py-1.5 focus:outline-none text-[#111110]">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="text-xs border border-[#e0e0dd] px-2 py-1.5 focus:outline-none text-[#111110]">
                    <option value="">Assign to...</option>
                    {teamMembers.map((m) => (
                      <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleCreate(col.key)} disabled={!newTask.title.trim() || saving}
                      className="flex-1 text-xs font-semibold bg-[#111110] text-white py-1.5 disabled:opacity-50">
                      {saving ? '...' : 'Add Task'}
                    </button>
                    <button onClick={() => setAdding(null)} className="text-xs border border-[#e0e0dd] px-3 text-[#6b6b66]">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div className="flex flex-col gap-2 min-h-[120px]">
                {colTasks.length === 0 && adding !== col.key ? (
                  <div className="border-2 border-dashed border-[#efefed] rounded-sm p-4 text-center">
                    <p className="text-xs text-[#a3a39e]">No tasks here</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task._id} task={task} teamMembers={teamMembers}
                      onUpdate={handleUpdate} onDelete={handleDelete}
                      projectId={project._id} isOwner={isOwner} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── FILES TAB ─────────────── */
function FilesTab({ project, user }) {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ name: '', url: '', type: 'link', description: '' });
  const [saving,  setSaving]  = useState(false);
  const isOwner = project.createdBy?._id === (user?._id || user?.id);

  useEffect(() => {
    teamFileAPI.getAll(project._id)
      .then(({ data }) => setFiles(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [project._id]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.url.trim()) return toast.error('Name and URL are required');
    setSaving(true);
    try {
      const { data } = await teamFileAPI.add(project._id, form);
      setFiles((prev) => [...prev, data.data]);
      setForm({ name: '', url: '', type: 'link', description: '' });
      setAdding(false);
      toast.success('File added!');
    } catch { toast.error('Failed to add file'); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (fileId) => {
    try {
      await teamFileAPI.delete(project._id, fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      toast.success('File removed');
    } catch { toast.error('Failed to remove file'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#6b6b66]">
          {files.length} shared file{files.length !== 1 ? 's' : ''}
        </p>
        <button onClick={() => setAdding(!adding)}
          className="btn-primary text-sm py-1.5 px-4">
          + Share Link
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="border border-[#111110] p-5 mb-6 flex flex-col gap-3">
          <h3 className="font-semibold text-sm text-[#111110]">Share a File or Link</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input className="input text-sm" placeholder="e.g. Script v2.pdf"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(FILE_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">URL *</label>
            <input className="input text-sm" placeholder="https://drive.google.com/..."
              value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <label className="label">Description <span className="text-[#a3a39e]">(optional)</span></label>
            <input className="input text-sm" placeholder="What is this file?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
              {saving ? 'Adding...' : 'Share File'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-outline text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#efefed]">
          <p className="text-3xl mb-3">📂</p>
          <p className="text-sm font-medium text-[#111110] mb-1">No shared files yet</p>
          <p className="text-xs text-[#a3a39e] mb-4">Share Google Drive, Dropbox, Notion, Figma links or any URL</p>
          <button onClick={() => setAdding(true)} className="btn-outline text-sm py-2 px-4">Share First File</button>
        </div>
      ) : (
        <div className="border border-[#efefed] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#f7f7f6] border-b border-[#efefed] text-xs font-semibold text-[#a3a39e] uppercase tracking-wider">
            <span className="col-span-4">Name</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-3">Added by</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-1"></span>
          </div>
          {files.map((file) => {
            const cfg = FILE_TYPE_CONFIG[file.type] || FILE_TYPE_CONFIG.other;
            return (
              <div key={file._id} className="grid grid-cols-12 gap-4 px-4 py-3.5 border-b border-[#f0f0ee] last:border-0 hover:bg-[#fafaf9] transition-colors items-center">
                <div className="col-span-4 min-w-0">
                  <a href={file.url.startsWith('http') ? file.url : `https://${file.url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-[#111110] hover:underline truncate flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span className="truncate">{file.name}</span>
                  </a>
                  {file.description && (
                    <p className="text-xs text-[#a3a39e] mt-0.5 truncate">{file.description}</p>
                  )}
                </div>
                <span className="col-span-2 text-xs text-[#6b6b66]">{cfg.label}</span>
                <span className="col-span-3 text-xs text-[#6b6b66] truncate">{file.uploadedBy?.name || 'Unknown'}</span>
                <span className="col-span-2 text-xs text-[#a3a39e]">{timeAgo(file.createdAt)}</span>
                <div className="col-span-1 flex justify-end">
                  {(isOwner || file.uploadedBy?._id === (user?._id || user?.id)) && (
                    <button onClick={() => handleDelete(file._id)}
                      className="text-xs text-[#a3a39e] hover:text-red-500 transition-colors px-1">✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────── PROGRESS TAB ─────────────── */
function ProgressTab({ project, setProject, user }) {
  const [updating, setUpdating] = useState(false);
  const isOwner   = project.createdBy?._id === (user?._id || user?.id);
  const canUpdate = isOwner; // Only the project owner can change the progress stage
  const currentIdx = TIMELINE_STAGES.indexOf(project.timelineStage || 'planning');

  const handleUpdate = async (stage) => {
    if (!canUpdate) return;
    setUpdating(true);
    try {
      const { data } = await timelineAPI.update(project._id, stage);
      setProject(data.data);
      toast.success(`Stage updated to ${STAGE_LABELS[stage].label}`);
    } catch { toast.error('Failed to update stage'); }
    finally   { setUpdating(false); }
  };

  return (
    <div className="p-6">
      {/* Current stage banner */}
      <div className="flex items-center gap-4 p-5 bg-[#111110] text-white mb-8">
        <span className="text-3xl">{STAGE_LABELS[project.timelineStage || 'planning'].icon}</span>
        <div>
          <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">Current Stage</p>
          <p className="text-xl font-bold">{STAGE_LABELS[project.timelineStage || 'planning'].label}</p>
        </div>
        {canUpdate
          ? <p className="ml-auto text-xs text-white/50">Click a stage below to update</p>
          : <p className="ml-auto text-xs text-white/30">Only the project owner can update progress</p>
        }
      </div>

      {/* Stage pipeline */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {TIMELINE_STAGES.map((stage, idx) => {
          const cfg      = STAGE_LABELS[stage];
          const isCurrent = project.timelineStage === stage || (!project.timelineStage && stage === 'planning');
          const isPast    = currentIdx > idx;
          return (
            <button key={stage} onClick={() => canUpdate && handleUpdate(stage)}
              disabled={!canUpdate || updating}
              className={`flex-1 p-4 border-2 text-center transition-all relative ${
                isCurrent ? 'border-[#111110] bg-[#111110] text-white' :
                isPast    ? 'border-green-300 bg-green-50' :
                'border-[#efefed] bg-white hover:border-[#111110]'
              } ${canUpdate ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-70`}
            >
              <p className="text-2xl mb-2">{cfg.icon}</p>
              <p className={`text-xs font-bold ${isCurrent ? 'text-white' : isPast ? 'text-green-700' : 'text-[#111110]'}`}>
                {cfg.label}
              </p>
              {isPast && (
                <span className="absolute top-2 right-2 text-green-600 text-sm">✓</span>
              )}
              {isCurrent && (
                <span className="absolute top-2 right-2 text-white/60 text-xs">Now</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Team roster */}
      <div className="card bg-white p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a39e] mb-4">Team Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Owner */}
          <div className="flex items-center gap-3 p-3 bg-[#f7f7f6]">
            <Avatar name={project.createdBy?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111110] truncate">{project.createdBy?.name}</p>
              <p className="text-xs text-[#a3a39e]">Owner</p>
            </div>
          </div>
          {/* Members */}
          {project.teamMembers?.map((m) => (
            <div key={m.user?._id} className="flex items-center gap-3 p-3 bg-[#f7f7f6]">
              <Avatar name={m.user?.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#111110] truncate">{m.user?.name}</p>
                <p className="text-xs text-[#a3a39e] capitalize">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
        {(!project.teamMembers || project.teamMembers.length === 0) && (
          <p className="text-sm text-[#a3a39e] mt-2">No team members yet. Accept applications to build your team.</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────── SCHEDULE TAB ─────────────── */
function ScheduleTab({ project, user }) {
  const isOwner  = project.createdBy?._id === (user?._id || user?.id);
  const isMember = project.teamMembers?.some((m) => m.user?._id === (user?._id || user?.id));
  const canAdd   = isOwner || isMember;

  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ title: '', date: '', startTime: '', endTime: '', location: '', notes: '' });

  useEffect(() => {
    scheduleAPI.getAll(project._id)
      .then(r => setEvents(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [project._id]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const { data } = await scheduleAPI.create(project._id, form);
      setEvents(prev => [...prev, data.data].sort((a,b) => new Date(a.date) - new Date(b.date)));
      setForm({ title: '', date: '', startTime: '', endTime: '', location: '', notes: '' });
      setAdding(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add event');
    } finally { setSaving(false); }
  };

  const handleDelete = async (eid) => {
    try {
      await scheduleAPI.delete(project._id, eid);
      setEvents(prev => prev.filter(e => e._id !== eid));
    } catch { toast.error('Failed to delete event'); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Group by month
  const grouped = events.reduce((acc, ev) => {
    const key = new Date(ev.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#111110]">Shooting Schedule</h2>
          <p className="text-xs text-[#a3a39e] mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        {canAdd && !adding && (
          <button onClick={() => setAdding(true)} className="btn-primary text-sm py-2 px-4">+ Add Event</button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="border border-[#efefed] rounded-xl p-5 mb-6 bg-[#fafaf9] space-y-4">
          <h3 className="text-sm font-semibold text-[#111110]">New Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input text-sm" placeholder="e.g. Shoot Day 1 — Rooftop Scene"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input text-sm"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input text-sm"
                value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input text-sm"
                value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location</label>
              <input className="input text-sm" placeholder="e.g. Bandra Rooftop, Mumbai"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input text-sm resize-none" rows={2} placeholder="Call time, what to bring, any instructions..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving || !form.title || !form.date}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Event'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-outline text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#efefed] rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#efefed] rounded-xl">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm font-medium text-[#111110] mb-1">No events scheduled yet</p>
          <p className="text-xs text-[#a3a39e] mb-4">Add shoot days, deadlines, and milestones for your team</p>
          {canAdd && <button onClick={() => setAdding(true)} className="btn-outline text-sm py-2 px-4">Add First Event</button>}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, evs]) => (
            <div key={month}>
              <p className="text-xs font-semibold text-[#a3a39e] uppercase tracking-widest mb-3">{month}</p>
              <div className="space-y-3">
                {evs.map(ev => {
                  const isPast = new Date(ev.date) < new Date();
                  return (
                    <div key={ev._id}
                      className={`border rounded-xl p-4 flex items-start gap-4 ${isPast ? 'border-[#efefed] bg-[#f7f7f6] opacity-60' : 'border-[#efefed] bg-white'}`}>
                      {/* Date block */}
                      <div className="shrink-0 w-14 text-center bg-[#efefed] rounded-lg py-2">
                        <p className="text-xs text-[#6b6b66] font-medium">
                          {new Date(ev.date).toLocaleDateString('en-IN', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-black text-[#111110] leading-none">
                          {new Date(ev.date).getDate()}
                        </p>
                        <p className="text-xs text-[#a3a39e]">
                          {new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                        </p>
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111110] text-sm">{ev.title}</p>
                        {(ev.startTime || ev.endTime) && (
                          <p className="text-xs text-[#6b6b66] mt-0.5">
                            🕐 {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                          </p>
                        )}
                        {ev.location && (
                          <p className="text-xs text-[#6b6b66] mt-0.5">📍 {ev.location}</p>
                        )}
                        {ev.notes && (
                          <p className="text-xs text-[#a3a39e] mt-1 line-clamp-2">{ev.notes}</p>
                        )}
                        <p className="text-xs text-[#a3a39e] mt-1">Added by {ev.createdBy?.name}</p>
                      </div>
                      {/* Delete */}
                      {isOwner && (
                        <button onClick={() => handleDelete(ev._id)}
                          className="text-xs text-[#a3a39e] hover:text-red-500 transition-colors shrink-0 px-1">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── MAIN PAGE ─────────────── */
export default function TeamDashboardPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read ?tab= from URL, default to 'chat'
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams('');
  const [tab, setTab] = useState(searchParams.get('tab') || 'chat');

  useEffect(() => {
    // Wait until auth is resolved — if user is still loading, don't run the check yet
    if (authLoading) return;

    // Not logged in at all → redirect to login
    if (!user) {
      router.push(`/login?redirect=/projects/${id}/team`);
      return;
    }

    projectAPI.getById(id)
      .then(({ data }) => {
        const p = data.data;
        const myId = user._id || user.id;
        const isOwner  = p.createdBy?._id === myId || p.createdBy?._id?.toString() === myId;
        const isMember = p.teamMembers?.some(
          (m) => m.user?._id === myId || m.user?._id?.toString() === myId
        );
        if (!isOwner && !isMember) {
          router.push(`/projects/${id}`);
          return;
        }
        setProject(p);
      })
      .catch(() => router.push('/projects'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading]);

  // Show spinner while auth OR project data is loading
  if (authLoading || loading || !project) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const TABS = [
    { key: 'chat',     label: '💬 Team Chat' },
    { key: 'tasks',    label: '📋 Tasks' },
    { key: 'files',    label: '📂 Files' },
    { key: 'schedule', label: '📅 Schedule' },
    { key: 'progress', label: '🎬 Progress' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="pt-24 pb-10 px-4 max-w-[1000px] mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href={`/projects/${id}`} className="text-xs text-[#6b6b66] hover:text-[#111110] transition-colors">
              ← Back to Project
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-[#111110] mt-1">Team Dashboard</h1>
            <p className="text-sm text-[#6b6b66] mt-0.5 truncate max-w-[400px]">{project.title}</p>
          </div>

          {/* Team member avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar name={project.createdBy?.name} size="sm" />
              {project.teamMembers?.slice(0, 4).map((m) => (
                <Avatar key={m.user?._id} name={m.user?.name} size="sm" />
              ))}
            </div>
            <span className="text-xs text-[#a3a39e]">
              {1 + (project.teamMembers?.length || 0)} member{(project.teamMembers?.length || 0) !== 0 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="card bg-white overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[#efefed] overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-[#111110] text-[#111110]'
                    : 'border-transparent text-[#6b6b66] hover:text-[#111110] hover:border-[#d0d0cd]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'chat'     && <ChatTab     project={project} user={user} />}
          {tab === 'tasks'    && <TasksTab    project={project} user={user} />}
          {tab === 'files'    && <FilesTab    project={project} user={user} />}
          {tab === 'schedule' && <ScheduleTab project={project} user={user} />}
          {tab === 'progress' && <ProgressTab project={project} setProject={setProject} user={user} />}
        </div>
      </div>
    </div>
  );
}
