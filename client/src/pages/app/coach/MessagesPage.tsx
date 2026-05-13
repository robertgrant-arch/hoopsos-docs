/**
 * MessagesPage — Coach team messaging hub.
 *
 * Two-column layout: thread list (320px) + active thread panel.
 * Supports a pinned team broadcast thread and individual player DMs.
 */
import { useState } from "react";
import { Link } from "wouter";
import { Send, Users, Megaphone } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { roster } from "@/lib/mock/data";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Message = {
  id: string;
  from: string;
  body: string;
  ts: string;
  isCoach: boolean;
};

type Thread = {
  id: string;
  label: string;
  subtitle: string;
  avatar: string;
  messages: Message[];
  unread: number;
  isTeam?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Mock seed data                                                              */
/* -------------------------------------------------------------------------- */

const TEAM_THREAD: Thread = {
  id: "thread_team",
  label: "Team · Varsity",
  subtitle: "All Players",
  avatar: "VB",
  isTeam: true,
  unread: 0,
  messages: [
    {
      id: "tm_1",
      from: "Coach Reed",
      body: "Film session tomorrow at 4 PM in the film room. Attendance is mandatory — we're going through second-half breakdowns from Friday's game.",
      ts: "8:45 AM",
      isCoach: true,
    },
    {
      id: "tm_2",
      from: "Coach Reed",
      body: "6 AM lift is ON for Thursday. Non-negotiable. Get your sleep and show up ready to work.",
      ts: "Yesterday",
      isCoach: true,
    },
    {
      id: "tm_3",
      from: "Coach Reed",
      body: "Great effort at practice today. The second-unit defense was elite. Let's carry that energy into Tuesday's scout.",
      ts: "2 days ago",
      isCoach: true,
    },
    {
      id: "tm_4",
      from: "Coach Reed",
      body: "Reminder: all players must complete their assigned film before Friday. Check your inbox and get it done.",
      ts: "3 days ago",
      isCoach: true,
    },
  ],
};

function buildPlayerThread(
  player: (typeof roster)[number],
  messages: Message[],
  unread: number
): Thread {
  return {
    id: `thread_${player.id}`,
    label: player.name,
    subtitle: `${player.position} · ${player.height}`,
    avatar: player.initials,
    messages,
    unread,
  };
}

const PLAYER_THREADS: Thread[] = [
  buildPlayerThread(
    roster[0], // Jalen Carter
    [
      {
        id: "jc_1",
        from: "Coach Reed",
        body: "Jalen — your release is looking cleaner this week. Keep it up. The one-motion improvement is real.",
        ts: "9:14 AM",
        isCoach: true,
      },
      {
        id: "jc_2",
        from: "Jalen Carter",
        body: "Thanks Coach, been putting in extra reps after practice. Focusing on not drifting forward at release.",
        ts: "9:22 AM",
        isCoach: false,
      },
      {
        id: "jc_3",
        from: "Coach Reed",
        body: "That's exactly what needs to happen. Keep that chest stacked and you'll be automatic by the end of the week.",
        ts: "9:31 AM",
        isCoach: true,
      },
    ],
    0
  ),
  buildPlayerThread(
    roster[1], // Marcus Williams
    [
      {
        id: "mw_1",
        from: "Marcus Williams",
        body: "Coach, quick question — on the Horns Flex counter, do I initiate the DHO if 2 is denied or wait for your call?",
        ts: "Yesterday · 4:02 PM",
        isCoach: false,
      },
      {
        id: "mw_2",
        from: "Coach Reed",
        body: "You read it and go. If you see the denial, flow right into it — don't wait for a call. That's your read to make.",
        ts: "Yesterday · 4:18 PM",
        isCoach: true,
      },
      {
        id: "mw_3",
        from: "Marcus Williams",
        body: "Got it. I'll rep it out in walkthrough tomorrow.",
        ts: "Yesterday · 4:21 PM",
        isCoach: false,
      },
    ],
    0
  ),
  buildPlayerThread(
    roster[2], // DeAndre Johnson
    [
      {
        id: "dj_1",
        from: "Coach Reed",
        body: "DeAndre, great effort in film today. Your understanding of the help-side rotation is improving.",
        ts: "10:00 AM",
        isCoach: true,
      },
      {
        id: "dj_2",
        from: "DeAndre Johnson",
        body: "I've been rewatching the clips you sent. Starting to see how it all connects.",
        ts: "10:45 AM",
        isCoach: false,
      },
      {
        id: "dj_3",
        from: "Coach Reed",
        body: "That's the process. We need you to be the anchor on the back line — you read the room better than you think.",
        ts: "11:03 AM",
        isCoach: true,
      },
    ],
    0
  ),
  buildPlayerThread(
    roster[3], // Tyrese Brooks
    [
      {
        id: "tb_1",
        from: "Coach Reed",
        body: "Make sure you're on time tomorrow — 6am lift. No exceptions this week.",
        ts: "8:00 PM",
        isCoach: true,
      },
      {
        id: "tb_2",
        from: "Tyrese Brooks",
        body: "I'll be there, Coach. Setting two alarms.",
        ts: "8:14 PM",
        isCoach: false,
      },
    ],
    0
  ),
  buildPlayerThread(
    roster[4], // Isaiah Moore
    [
      {
        id: "im_1",
        from: "Coach Reed",
        body: "Isaiah — missed you at WOD today. Everything alright? Shoot me a message when you get this.",
        ts: "2 days ago · 11:30 AM",
        isCoach: true,
      },
      {
        id: "im_2",
        from: "Isaiah Moore",
        body: "Sorry Coach, wasn't feeling well. I'll make it up this week.",
        ts: "2 days ago · 2:15 PM",
        isCoach: false,
      },
      {
        id: "im_3",
        from: "Coach Reed",
        body: "Understood. Get healthy and let me know before tomorrow. We need you at practice.",
        ts: "2 days ago · 2:40 PM",
        isCoach: true,
      },
    ],
    1
  ),
  buildPlayerThread(
    roster[5], // Khalil Jenkins
    [
      {
        id: "kj_1",
        from: "Coach Reed",
        body: "Khalil, you've been doing good work in practice. Want to talk about getting you more minutes on the second unit.",
        ts: "Yesterday · 5:00 PM",
        isCoach: true,
      },
      {
        id: "kj_2",
        from: "Khalil Jenkins",
        body: "That would be great Coach. I'm ready for the opportunity.",
        ts: "Yesterday · 5:30 PM",
        isCoach: false,
      },
      {
        id: "kj_3",
        from: "Coach Reed",
        body: "Come early on Tuesday and we'll talk through what I need from you in that role.",
        ts: "Yesterday · 5:45 PM",
        isCoach: true,
      },
    ],
    2
  ),
];

const INITIAL_THREADS: Thread[] = [TEAM_THREAD, ...PLAYER_THREADS];

/* -------------------------------------------------------------------------- */
/* Timestamp display                                                           */
/* -------------------------------------------------------------------------- */

function formatTs(ts: string): string {
  return ts;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function MessagesPage() {
  const [activeThreadId, setActiveThreadId] = useState<string>(
    INITIAL_THREADS[0].id
  );
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [compose, setCompose] = useState("");

  const activeThread = threads.find((t) => t.id === activeThreadId)!;

  function handleSend() {
    const body = compose.trim();
    if (!body) return;

    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      from: "Coach Reed",
      body,
      ts,
      isCoach: true,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: [...t.messages, newMsg] }
          : t
      )
    );
    setCompose("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleThreadClick(id: string) {
    setActiveThreadId(id);
    // Mark thread as read on open
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
    );
  }

  return (
    <AppShell>
      <div className="flex h-screen flex-col">
        {/* Page header area */}
        <div className="px-6 lg:px-10 pt-8 pb-0">
          <PageHeader
            eyebrow="Coach HQ"
            title="Messages"
            subtitle="Team broadcasts and direct messages with your athletes."
          />
        </div>

        {/* Two-column split */}
        <div
          className="flex flex-1 overflow-hidden border-t border-border"
          style={{ minHeight: 0 }}
        >
          {/* ---------------------------------------------------------------- */}
          {/* Left: Thread list                                                */}
          {/* ---------------------------------------------------------------- */}
          <div
            className="shrink-0 border-r border-border flex flex-col overflow-y-auto"
            style={{ width: 320 }}
          >
            <div className="px-3 py-3 border-b border-border">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                Conversations
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const lastMsg =
                  thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadClick(thread.id)}
                    className={`w-full text-left px-3 py-3 transition-colors flex items-start gap-3 ${
                      isActive
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "border-l-2 border-transparent hover:bg-muted"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold ${
                        thread.isTeam
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {thread.isTeam ? (
                        <Megaphone className="w-4 h-4" />
                      ) : (
                        thread.avatar
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-semibold truncate">
                          {thread.label}
                        </span>
                        {thread.unread > 0 && (
                          <Badge className="text-[10px] h-4 min-w-[16px] px-1 shrink-0">
                            {thread.unread}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {thread.subtitle}
                      </div>
                      {lastMsg && (
                        <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                          {lastMsg.isCoach ? "You: " : ""}
                          {lastMsg.body}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right: Active thread                                             */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Thread header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 shrink-0">
              {activeThread.isTeam ? (
                <div className="w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-[11px] font-bold text-muted-foreground">
                  {activeThread.avatar}
                </div>
              )}
              <div>
                <div className="font-semibold text-[14px]">
                  {activeThread.label}
                </div>
                <div className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                  {activeThread.isTeam && (
                    <Users className="w-3 h-3 inline-block mr-0.5" />
                  )}
                  {activeThread.subtitle}
                </div>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isCoach ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-[13.5px] ${
                      msg.isCoach
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {!msg.isCoach && (
                      <div className="text-[10.5px] font-semibold mb-0.5 opacity-70">
                        {msg.from}
                      </div>
                    )}
                    <div className="leading-relaxed">{msg.body}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        msg.isCoach
                          ? "text-primary-foreground/60 text-right"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTs(msg.ts)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose area */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeThread.isTeam
                      ? "Broadcast a message to the whole team…"
                      : `Message ${activeThread.label}…`
                  }
                  className="resize-none text-[13.5px] min-h-[72px] max-h-[160px]"
                  rows={3}
                />
                <Button
                  onClick={handleSend}
                  disabled={!compose.trim()}
                  className="shrink-0 h-10"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Send
                </Button>
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-1.5">
                ⌘ + Enter to send
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default MessagesPage;
