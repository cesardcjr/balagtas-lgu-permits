import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const formatMsgDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy h:mm a');
};

const formatDivider = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
};

export default function Inbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [msgForm, setMsgForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const threadEndRef = useRef(null);

  const loadList = () => {
    setLoadingList(true);
    const ep = tab === 'inbox' ? '/api/messages/inbox' : '/api/messages/sent';
    axios.get(ep).then(r => setMessages(r.data)).finally(() => setLoadingList(false));
  };

  useEffect(() => { loadList(); }, [tab]);
  useEffect(() => { axios.get('/api/messages/admin-contact').then(r => setAdmin(r.data)).catch(() => {}); }, []);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyBody('');
    setLoadingThread(true);
    try {
      // Mark thread as read
      if (tab === 'inbox') {
        await axios.patch(`/api/messages/thread/${msg.threadId}/read`).catch(() => {});
        setMessages(prev => prev.map(m => m.threadId === msg.threadId ? { ...m, isRead: true } : m));
      }
      // Load full thread
      const res = await axios.get(`/api/messages/thread/${msg.threadId}`);
      setThread(res.data);
    } catch {
      setThread([msg]);
    } finally {
      setLoadingThread(false);
    }
  };

  const sendCompose = async (e) => {
    e.preventDefault();
    if (!admin) return toast.error('Admin not found');
    setSending(true);
    try {
      const res = await axios.post('/api/messages', {
        recipientId: admin._id,
        subject: msgForm.subject,
        body: msgForm.body
      });
      toast.success('Message sent!');
      setShowCompose(false);
      setMsgForm({ subject: '', body: '' });
      if (tab === 'sent') loadList();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const sendReply = async () => {
    if (!replyBody.trim() || !selected) return;
    setSending(true);
    try {
      const recipientId = tab === 'inbox'
        ? selected.sender?._id
        : selected.recipient?._id;
      await axios.post('/api/messages', {
        recipientId,
        subject: selected.subject.startsWith('Re:') ? selected.subject : 'Re: ' + selected.subject,
        body: replyBody,
        permitId: selected.permit?._id,
        parentMessageId: selected._id
      });
      toast.success('Reply sent!');
      setReplyBody('');
      // Reload thread
      const res = await axios.get(`/api/messages/thread/${selected.threadId}`);
      setThread(res.data);
      loadList();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  // Group thread messages by date for dividers
  const renderThread = () => {
    const items = [];
    let lastDate = null;
    thread.forEach((msg, i) => {
      const msgDate = new Date(msg.createdAt);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push(
          <div key={`divider-${i}`} className="thread-date-divider">
            <span>{formatDivider(msg.createdAt)}</span>
          </div>
        );
        lastDate = msgDate;
      }
      const isSent = msg.sender?._id === user?.id || msg.sender?._id?.toString() === user?.id;
      items.push(
        <div key={msg._id} className={`thread-bubble ${isSent ? 'sent' : 'received'}`}>
          <div className="thread-bubble-meta">
            {!isSent && (
              <div className="message-avatar" style={{ width: 26, height: 26, fontSize: 10, background: msg.sender?.role === 'admin' ? '#1e4e78' : '#e8a020', color: msg.sender?.role === 'admin' ? '#fff' : '#1e4e78' }}>
                {initials(msg.sender?.fullName)}
              </div>
            )}
            <span className="thread-sender">{isSent ? 'You' : msg.sender?.fullName}</span>
            {msg.sender?.role === 'admin' && !isSent && (
              <span className="thread-sender-role">Admin</span>
            )}
            <span className="thread-time">{formatMsgDate(msg.createdAt)}</span>
          </div>
          <div className="thread-bubble-body">{msg.body}</div>
        </div>
      );
    });
    return items;
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>✉️ Messages</h1>
          <p>Communication with the Engineering Office</p>
        </div>

        <div className="inbox-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 170px)', minHeight: 500 }}>
          {/* LEFT: Message List */}
          <div className="card inbox-list-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
            <div style={{ padding: '14px 14px 0' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} onClick={() => setShowCompose(true)}>
                ✏️ New Message
              </button>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <div className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => { setTab('inbox'); setSelected(null); setThread([]); }}>Inbox</div>
                <div className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => { setTab('sent'); setSelected(null); setThread([]); }}>Sent</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : messages.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon">✉️</div>
                  <h3>{tab === 'inbox' ? 'No Messages' : 'No Sent Messages'}</h3>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map(msg => {
                    const isUnread = !msg.isRead && tab === 'inbox';
                    const isActive = selected?.threadId === msg.threadId;
                    const contact = tab === 'inbox' ? msg.sender : msg.recipient;
                    return (
                      <div
                        key={msg._id}
                        className={`message-item ${isUnread ? 'unread' : ''}`}
                        onClick={() => openMessage(msg)}
                        style={{ background: isActive ? 'rgba(30,78,120,0.08)' : undefined, borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent' }}
                      >
                        {isUnread && <div className="message-unread-dot" />}
                        <div className="message-avatar" style={{ background: contact?.role === 'admin' ? '#1e4e78' : '#e8a020', color: contact?.role === 'admin' ? '#fff' : '#1e4e78', width: 34, height: 34, fontSize: 11 }}>
                          {initials(contact?.fullName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {contact?.fullName || '?'}
                              {contact?.role === 'admin' && <span style={{ marginLeft: 4, fontSize: 9, background: '#1e4e78', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>Admin</span>}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 'shrink', whiteSpace: 'nowrap' }}>{formatMsgDate(msg.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: 'var(--text)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</div>
                          {msg.permit && <div style={{ fontSize: 10, color: 'var(--primary)', marginTop: 2 }}>📋 {msg.permit.transactionNumber}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Thread View */}
          <div className="card inbox-view-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selected ? (
              <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state-icon">💬</div>
                <h3>Select a Message</h3>
                <p>Click a message to view the full conversation thread.</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#fafbfc' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{selected.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>👥 {thread.length} message{thread.length !== 1 ? 's' : ''} in thread</span>
                    {selected.permit && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>📋 {selected.permit.transactionNumber}</span>}
                  </div>
                </div>

                {/* Thread messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {loadingThread ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                  ) : (
                    <div className="conversation-thread">
                      {renderThread()}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>

                {/* Reply box */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: '#fafbfc' }}>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Type your reply..."
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(); }}
                    style={{ marginBottom: 8, resize: 'none', fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ctrl+Enter to send</span>
                    <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={sending || !replyBody.trim()}>
                      {sending ? '⏳ Sending...' : '📤 Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="compose-modal-overlay" onClick={() => setShowCompose(false)}>
            <div className="compose-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>✉️ New Message</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCompose(false)}>✕</button>
              </div>
              <form onSubmit={sendCompose}>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input className="form-control" value="Engineering Office — Municipality of Balagtas" disabled style={{ background: '#f0f4f8' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject <span>*</span></label>
                  <input className="form-control" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Subject of your message" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message <span>*</span></label>
                  <textarea className="form-control" rows={6} value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))} required style={{ resize: 'vertical' }} placeholder="Type your message here..." />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCompose(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? '⏳ Sending...' : '📤 Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
