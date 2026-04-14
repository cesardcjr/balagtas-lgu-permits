import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

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

export default function AdminInbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef(null);

  const loadList = () => {
    setLoadingList(true);
    const ep = tab === 'inbox' ? '/api/messages/inbox' : '/api/messages/sent';
    axios.get(ep).then(r => setMessages(r.data)).finally(() => setLoadingList(false));
  };

  useEffect(() => { loadList(); }, [tab]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyBody('');
    setLoadingThread(true);
    try {
      if (tab === 'inbox') {
        await axios.patch(`/api/messages/thread/${msg.threadId}/read`).catch(() => {});
        setMessages(prev => prev.map(m => m.threadId === msg.threadId ? { ...m, isRead: true } : m));
      }
      const res = await axios.get(`/api/messages/thread/${msg.threadId}`);
      setThread(res.data);
    } catch {
      setThread([msg]);
    } finally {
      setLoadingThread(false);
    }
  };

  const sendReply = async () => {
    if (!replyBody.trim() || !selected) return;
    setSending(true);
    try {
      const recipientId = tab === 'inbox' ? selected.sender?._id : selected.recipient?._id;
      await axios.post('/api/messages', {
        recipientId,
        subject: selected.subject.startsWith('Re:') ? selected.subject : 'Re: ' + selected.subject,
        body: replyBody,
        permitId: selected.permit?._id,
        parentMessageId: selected._id
      });
      toast.success('Reply sent!');
      setReplyBody('');
      const res = await axios.get(`/api/messages/thread/${selected.threadId}`);
      setThread(res.data);
      loadList();
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  const renderThread = () => {
    const items = [];
    let lastDate = null;
    thread.forEach((msg, i) => {
      const msgDate = new Date(msg.createdAt);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push(
          <div key={`div-${i}`} className="thread-date-divider">
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
              <div className="message-avatar" style={{ width: 26, height: 26, fontSize: 10, background: '#e8a020', color: '#1e4e78' }}>
                {initials(msg.sender?.fullName)}
              </div>
            )}
            <span className="thread-sender">{isSent ? 'You (Admin)' : msg.sender?.fullName}</span>
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
          <h1>✉️ Admin Inbox</h1>
          <p>Messages from permit applicants</p>
        </div>

        <div className="inbox-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 170px)', minHeight: 500 }}>
          {/* LEFT: Message List */}
          <div className="card inbox-list-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 14px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <div className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => { setTab('inbox'); setSelected(null); setThread([]); }}>
                  📥 Inbox
                </div>
                <div className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => { setTab('sent'); setSelected(null); setThread([]); }}>
                  📤 Sent
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : messages.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon">✉️</div>
                  <h3>{tab === 'inbox' ? 'No Messages' : 'No Sent'}</h3>
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
                        <div className="message-avatar" style={{ background: '#e8a020', color: '#1e4e78', width: 32, height: 32, fontSize: 11 }}>
                          {initials(contact?.fullName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact?.fullName}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatMsgDate(msg.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: isUnread ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', marginBottom: 1 }}>{msg.subject}</div>
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

          {/* RIGHT: Thread */}
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
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{selected.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>From: <strong>{tab === 'inbox' ? selected.sender?.fullName : selected.recipient?.fullName}</strong></span>
                      <span>👥 {thread.length} message{thread.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {selected.permit && (
                    <Link to={`/admin/permits/${selected.permit._id}`} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                      📋 View Permit →
                    </Link>
                  )}
                </div>

                {/* Thread messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                  {loadingThread ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                  ) : (
                    <div className="conversation-thread">
                      {renderThread()}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>

                {/* Reply */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: '#fafbfc' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Reply to {tab === 'inbox' ? selected.sender?.fullName : selected.recipient?.fullName}
                  </div>
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
      </main>
    </div>
  );
}
