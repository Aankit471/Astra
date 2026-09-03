import { useState } from 'react'
import {
  HeartPulse,
  Paperclip,
  Send,
} from 'lucide-react'
import {
  MOCK_DOCTOR_CONVERSATIONS,
  type DoctorConversation,
  type DoctorMessage,
} from '@/data/doctorData'

export function DoctorMessagesView() {
  const [conversations, setConversations] = useState<DoctorConversation[]>(
    MOCK_DOCTOR_CONVERSATIONS
  )
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || '')
  const [newMessageText, setNewMessageText] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim() || !activeConversation) return

    const newMsg: DoctorMessage = {
      id: `M-${Date.now()}`,
      senderName: 'Dr. Sarah Jenkins, MD',
      senderRole: 'Lead Interventional Cardiologist',
      senderFacility: 'Metro Central Hospital / Apollo',
      text: newMessageText.trim(),
      timestamp: 'Just now',
      isDoctor: true,
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessageTime: 'Just now',
              messages: [...c.messages, newMsg],
            }
          : c
      )
    )

    setNewMessageText('')
    setToastMessage('Clinical message dispatched over encrypted clinical link.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAttachFile = () => {
    setToastMessage('Attachment interface ready (12-Lead ECG / Telemetry Trace attached).')
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            ENCRYPTED CLINICAL MESSAGING
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Inter-Team Communication
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct clinical coordination with 108 Emergency EMS, CICU Charge Nurses, and Surgical Teams.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">Live Clinical Link Active</span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-teal-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Messaging Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Left: Conversations List */}
        <div className="card bg-slate-900/90 border-slate-800 p-3 space-y-2 overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
            Clinical Contacts
          </span>

          <div className="space-y-1">
            {conversations.map((conv) => {
              const isSelected = conv.id === activeConvId
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/40 text-white shadow-sm'
                      : 'bg-black/30 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0">
                    <strong className="text-xs font-bold block truncate">
                      {conv.contactName}
                    </strong>
                    <span className="text-[10px] text-teal-400 block font-medium">
                      {conv.role}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {conv.facility}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {conv.lastMessageTime}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full mt-1 inline-block">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="md:col-span-2 card bg-slate-900/90 border-slate-800 flex flex-col justify-between overflow-hidden">
          {/* Active Conversation Header & Patient Context */}
          {activeConversation && (
            <div className="p-4 border-b border-slate-800 bg-[#060b13] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {activeConversation.contactName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeConversation.role} · {activeConversation.facility}
                  </p>
                </div>

                <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                  SECURE EMR PROTOCOL
                </span>
              </div>

              {/* Patient Context Badge */}
              {activeConversation.patientContext && (
                <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-500/30 flex items-center justify-between text-xs text-teal-300">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={14} className="text-teal-400" />
                    <span>
                      Active Clinical Context: <strong>{activeConversation.patientContext.name}</strong> ({activeConversation.patientContext.id})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeConversation.patientContext.reason}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Messages History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {activeConversation?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isDoctor ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-3 rounded-2xl space-y-1 ${
                    m.isDoctor
                      ? 'bg-teal-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                    <span className="font-bold">{m.senderName}</span>
                    <span className="font-mono">{m.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-xs">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Composer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-[#060b13] flex items-center gap-2">
            <button
              type="button"
              onClick={handleAttachFile}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Attach ECG / Document"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type urgent clinical order, question, or verification..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />

            <button
              type="submit"
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
