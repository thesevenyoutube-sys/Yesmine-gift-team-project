import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  MessageSquare,
  Hash,
  User,
  Paperclip,
  Send,
  Plus,
  Smile,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { ChatChannel, ChatMessage, UserProfile, Project } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ChatView: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    isDemoMode,
    demoChannels,
    demoMessages,
    demoUsers,
    demoProjects,
    addDemoMessage,
  } = useDemo();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Input
  const [inputText, setInputText] = useState('');
  const [attachmentData, setAttachmentData] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure default General channel exists
  const ensureGeneralChannel = async () => {
    if (isDemoMode) return;
    try {
      const generalDoc = doc(db, 'chat_channels', 'general');
      await setDoc(
        generalDoc,
        {
          id: 'general',
          name: 'General Discussion',
          type: 'general',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Channel ensure error:', err);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setChannels(demoChannels);
      setUsers(demoUsers);
      setProjects(demoProjects);
      setLoading(false);
      return;
    }

    ensureGeneralChannel();

    // Subscribe to channels
    const unsubChannels = onSnapshot(collection(db, 'chat_channels'), (snap) => {
      const list: ChatChannel[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setChannels(list);
    });

    // Subscribe to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setUsers(list);
    });

    // Subscribe to projects
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setProjects(list);
    });

    return () => {
      unsubChannels();
      unsubUsers();
      unsubProjects();
    };
  }, [isDemoMode, demoChannels, demoUsers, demoProjects]);

  // Subscribe to messages in active channel
  useEffect(() => {
    if (!activeChannelId) return;

    if (isDemoMode) {
      const msgs = demoMessages[activeChannelId] || [];
      setMessages([...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chat_messages'),
      where('channelId', '==', activeChannelId)
    );

    const unsubMessages = onSnapshot(
      q,
      (snap) => {
        const list: ChatMessage[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        // Sort by createdAt ascending
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'chat_messages');
        setLoading(false);
      }
    );

    return () => unsubMessages();
  }, [activeChannelId, isDemoMode, demoMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachmentData) || !userProfile) return;

    const id = `msg_${Date.now()}`;
    const msg: ChatMessage = {
      id,
      channelId: activeChannelId,
      senderId: userProfile.id,
      senderName: userProfile.name,
      senderAvatar: userProfile.avatarUrl,
      content: inputText.trim(),
      attachmentUrl: attachmentData?.url,
      attachmentName: attachmentData?.name,
      attachmentType: attachmentData?.type,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoMessage(activeChannelId, msg);
      setInputText('');
      setAttachmentData(null);
      return;
    }

    try {
      await setDoc(doc(db, 'chat_messages', id), msg);

      // Update channel last message
      await setDoc(
        doc(db, 'chat_channels', activeChannelId),
        {
          lastMessage: inputText.trim() || 'Attachment',
          lastMessageAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setInputText('');
      setAttachmentData(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chat_messages/${id}`);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentData({
          name: file.name,
          url: reader.result as string,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDM = async (otherUser: UserProfile) => {
    if (!userProfile) return;
    const dmId = `dm_${[userProfile.id, otherUser.id].sort().join('_')}`;

    try {
      await setDoc(
        doc(db, 'chat_channels', dmId),
        {
          id: dmId,
          name: otherUser.name,
          type: 'direct',
          members: [userProfile.id, otherUser.id],
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setActiveChannelId(dmId);
    } catch (err) {
      console.warn('Failed to open DM:', err);
    }
  };

  const handleCreateProjectChannel = async (project: Project) => {
    const chId = `proj_${project.id}`;
    try {
      await setDoc(
        doc(db, 'chat_channels', chId),
        {
          id: chId,
          name: `${project.name}`,
          type: 'project',
          projectId: project.id,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setActiveChannelId(chId);
    } catch (err) {
      console.warn('Failed to open project channel:', err);
    }
  };

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) || {
      id: 'general',
      name: 'General Discussion',
      type: 'general',
    };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
      {/* Sidebar: Channels & DMs */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Main Channels */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              <span>Channels</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveChannelId('general')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeChannelId === 'general'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="truncate">General</span>
              </button>

              {/* Project channels */}
              {projects.map((proj) => {
                const pChId = `proj_${proj.id}`;
                const isCurrent = activeChannelId === pChId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleCreateProjectChannel(proj)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color || '#6366f1' }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              <span>Direct Messages</span>
            </div>
            <div className="space-y-0.5">
              {users
                .filter((u) => u.id !== userProfile?.id)
                .map((u) => {
                  const dmId = `dm_${[userProfile?.id, u.id].sort().join('_')}`;
                  const isCurrent = activeChannelId === dmId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleOpenDM(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{u.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {activeChannel.type === 'direct' ? <User className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                {activeChannel.name}
              </h2>
              <span className="text-[11px] text-slate-400">
                {activeChannel.type === 'direct' ? 'Direct message' : 'Team Channel'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <LoadingSpinner message="Loading messages..." />
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No messages yet
              </p>
              <p className="text-xs max-w-xs mt-1">
                Say hello or share project updates in this channel!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === userProfile?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className={`space-y-1 ${isMe ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {msg.senderName}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                      {msg.attachmentUrl && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          {msg.attachmentType?.startsWith('image/') ? (
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'Attachment'}
                              className="max-h-48 rounded-xl object-cover"
                            />
                          ) : (
                            <a
                              href={msg.attachmentUrl}
                              download={msg.attachmentName}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {msg.attachmentName}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {attachmentData && (
            <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
              <span className="truncate">Attached: {attachmentData.name}</span>
              <button onClick={() => setAttachmentData(null)} className="p-1 hover:text-rose-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <label className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Paperclip className="w-4 h-4" />
              <input type="file" onChange={handleFileAttach} className="hidden" />
            </label>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message #${activeChannel.name}...`}
              className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachmentData}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
