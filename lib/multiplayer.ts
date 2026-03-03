/**
 * Multiplayer room system using Supabase Realtime (Broadcast + Presence).
 * No database tables needed — pure real-time channels.
 */
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// --- Types ---

export type PlayerId = string; // unique per session

export interface RoomPlayer {
  id: PlayerId;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
}

export interface Vote {
  voterId: PlayerId;
  targetId: PlayerId;
}

export type GamePhase =
  | "lobby"
  | "prompt"
  | "voting"
  | "reveal"
  | "superlatives";

export interface RoundState {
  promptIndex: number;
  promptText: string;
  phase: GamePhase;
  votes: Vote[];
  timerEnd: number; // unix ms
  roundNumber: number;
  totalRounds: number;
}

export interface RoomState {
  code: string;
  players: RoomPlayer[];
  round: RoundState | null;
  // Accumulated stats
  allVotes: Vote[][]; // votes per round
  reactions: { emoji: string; playerId: PlayerId; ts: number }[];
}

// --- Helpers ---

const AVATARS = [
  "😎", "🤪", "😈", "🥳", "🤠", "👻", "🦊", "🐸", "🦄", "🔥",
  "⚡", "💀", "🎃", "🤖", "👽", "🦁", "🐼", "🦋", "🎭", "🌟",
];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function pickAvatar(existingAvatars: string[]): string {
  const available = AVATARS.filter((a) => !existingAvatars.includes(a));
  if (available.length === 0) return AVATARS[Math.floor(Math.random() * AVATARS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

// --- Room Manager ---

type RoomEventHandler = {
  onStateChange: (state: RoomState) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onReaction: (emoji: string, playerName: string) => void;
  onPlayerJoined: (player: RoomPlayer) => void;
  onPlayerLeft: (playerName: string) => void;
  onError: (msg: string) => void;
};

export class MultiplayerRoom {
  private channel: RealtimeChannel | null = null;
  private state: RoomState;
  private playerId: PlayerId;
  private handlers: Partial<RoomEventHandler> = {};
  private voteTimerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.playerId = generatePlayerId();
    this.state = {
      code: "",
      players: [],
      round: null,
      allVotes: [],
      reactions: [],
    };
  }

  get myId() {
    return this.playerId;
  }

  get currentState() {
    return this.state;
  }

  get isHost() {
    return this.state.players.find((p) => p.id === this.playerId)?.isHost ?? false;
  }

  on<K extends keyof RoomEventHandler>(event: K, handler: RoomEventHandler[K]) {
    this.handlers[event] = handler;
  }

  // --- Create Room ---
  async createRoom(playerName: string): Promise<string> {
    const code = generateRoomCode();
    const avatar = pickAvatar([]);
    const me: RoomPlayer = {
      id: this.playerId,
      name: playerName,
      avatar,
      isHost: true,
      joinedAt: Date.now(),
    };

    this.state.code = code;
    this.state.players = [me];
    this.state.allVotes = [];
    this.state.reactions = [];

    await this.joinChannel(code);
    this.broadcastState();
    return code;
  }

  // --- Join Room ---
  async joinRoom(code: string, playerName: string): Promise<void> {
    this.state.code = code.toUpperCase();

    await this.joinChannel(this.state.code);

    // Wait briefly for presence sync, then announce join
    setTimeout(() => {
      const existingAvatars = this.state.players.map((p) => p.avatar);
      const avatar = pickAvatar(existingAvatars);
      const me: RoomPlayer = {
        id: this.playerId,
        name: playerName,
        avatar,
        isHost: false,
        joinedAt: Date.now(),
      };

      this.channel?.send({
        type: "broadcast",
        event: "player_join",
        payload: { player: me },
      });
    }, 500);
  }

  // --- Channel Setup ---
  private async joinChannel(code: string) {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
    }

    this.channel = supabase.channel(`room:${code}`, {
      config: { broadcast: { self: true } },
    });

    // Listen for broadcasts
    this.channel
      .on("broadcast", { event: "state_sync" }, ({ payload }) => {
        this.handleStateSync(payload);
      })
      .on("broadcast", { event: "player_join" }, ({ payload }) => {
        this.handlePlayerJoin(payload.player);
      })
      .on("broadcast", { event: "player_leave" }, ({ payload }) => {
        this.handlePlayerLeave(payload.playerId);
      })
      .on("broadcast", { event: "vote" }, ({ payload }) => {
        this.handleVote(payload.vote);
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        this.handleReaction(payload.emoji, payload.playerId, payload.playerName);
      })
      .on("broadcast", { event: "start_game" }, ({ payload }) => {
        this.handleStartGame(payload);
      })
      .on("broadcast", { event: "next_round" }, ({ payload }) => {
        this.handleNextRound(payload);
      })
      .on("broadcast", { event: "force_reveal" }, () => {
        this.handleForceReveal();
      })
      .on("broadcast", { event: "end_game" }, () => {
        this.handleEndGame();
      })
      .on("broadcast", { event: "request_state" }, () => {
        // Only host responds with full state
        if (this.isHost) {
          this.broadcastState();
        }
      });

    await this.channel.subscribe();

    // If not host, request current state
    if (!this.isHost) {
      setTimeout(() => {
        this.channel?.send({
          type: "broadcast",
          event: "request_state",
          payload: {},
        });
      }, 300);
    }
  }

  // --- Broadcast State ---
  private broadcastState() {
    this.channel?.send({
      type: "broadcast",
      event: "state_sync",
      payload: {
        players: this.state.players,
        round: this.state.round,
        allVotes: this.state.allVotes,
      },
    });
    this.handlers.onStateChange?.(this.state);
  }

  // --- Event Handlers ---

  private handleStateSync(payload: any) {
    this.state.players = payload.players || [];
    this.state.round = payload.round || null;
    this.state.allVotes = payload.allVotes || [];

    // If we're a joiner and not in the player list yet, we'll be added via player_join
    this.handlers.onStateChange?.(this.state);
    if (this.state.round) {
      this.handlers.onPhaseChange?.(this.state.round.phase);
    }
  }

  private handlePlayerJoin(player: RoomPlayer) {
    // Avoid duplicates
    if (this.state.players.some((p) => p.id === player.id)) return;

    this.state.players.push(player);
    this.handlers.onPlayerJoined?.(player);
    this.handlers.onStateChange?.(this.state);

    // Host syncs full state to everyone
    if (this.isHost) {
      this.broadcastState();
    }
  }

  private handlePlayerLeave(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    this.state.players = this.state.players.filter((p) => p.id !== playerId);
    if (player) {
      this.handlers.onPlayerLeft?.(player.name);
    }
    this.handlers.onStateChange?.(this.state);
  }

  private handleVote(vote: Vote) {
    if (!this.state.round) return;

    // Avoid duplicate votes from same voter
    if (this.state.round.votes.some((v) => v.voterId === vote.voterId)) return;

    this.state.round.votes.push(vote);
    this.handlers.onStateChange?.(this.state);

    // Check if all players have voted
    if (this.state.round.votes.length >= this.state.players.length) {
      this.triggerReveal();
    }
  }

  private handleReaction(emoji: string, playerId: string, playerName: string) {
    this.state.reactions.push({ emoji, playerId, ts: Date.now() });
    // Keep only last 50 reactions
    if (this.state.reactions.length > 50) {
      this.state.reactions = this.state.reactions.slice(-50);
    }
    this.handlers.onReaction?.(emoji, playerName);
  }

  private handleStartGame(payload: any) {
    this.state.round = {
      promptIndex: payload.promptIndex,
      promptText: payload.promptText,
      phase: "voting",
      votes: [],
      timerEnd: Date.now() + 15000,
      roundNumber: 1,
      totalRounds: payload.totalRounds || 10,
    };
    this.state.allVotes = [];
    this.startVoteTimer();
    this.handlers.onPhaseChange?.("voting");
    this.handlers.onStateChange?.(this.state);
  }

  private handleNextRound(payload: any) {
    // Save previous votes
    if (this.state.round) {
      this.state.allVotes.push([...this.state.round.votes]);
    }

    this.state.round = {
      promptIndex: payload.promptIndex,
      promptText: payload.promptText,
      phase: "voting",
      votes: [],
      timerEnd: Date.now() + 15000,
      roundNumber: payload.roundNumber,
      totalRounds: payload.totalRounds,
    };
    this.startVoteTimer();
    this.handlers.onPhaseChange?.("voting");
    this.handlers.onStateChange?.(this.state);
  }

  private handleForceReveal() {
    this.triggerReveal();
  }

  private handleEndGame() {
    // Save last round votes
    if (this.state.round) {
      this.state.allVotes.push([...this.state.round.votes]);
      this.state.round.phase = "superlatives";
    }
    this.handlers.onPhaseChange?.("superlatives");
    this.handlers.onStateChange?.(this.state);
  }

  // --- Actions ---

  submitVote(targetId: PlayerId) {
    if (!this.state.round) return;
    // Don't allow double voting
    if (this.state.round.votes.some((v) => v.voterId === this.playerId)) return;

    const vote: Vote = { voterId: this.playerId, targetId };
    this.channel?.send({
      type: "broadcast",
      event: "vote",
      payload: { vote },
    });
  }

  hasVoted(): boolean {
    return (
      this.state.round?.votes.some((v) => v.voterId === this.playerId) ?? false
    );
  }

  sendReaction(emoji: string) {
    const me = this.state.players.find((p) => p.id === this.playerId);
    this.channel?.send({
      type: "broadcast",
      event: "reaction",
      payload: {
        emoji,
        playerId: this.playerId,
        playerName: me?.name ?? "???",
      },
    });
  }

  // Host only actions
  startGame(promptText: string, promptIndex: number, totalRounds: number) {
    if (!this.isHost) return;
    this.channel?.send({
      type: "broadcast",
      event: "start_game",
      payload: { promptText, promptIndex, totalRounds },
    });
  }

  nextRound(promptText: string, promptIndex: number, roundNumber: number, totalRounds: number) {
    if (!this.isHost) return;
    this.channel?.send({
      type: "broadcast",
      event: "next_round",
      payload: { promptText, promptIndex, roundNumber, totalRounds },
    });
  }

  forceReveal() {
    if (!this.isHost) return;
    this.channel?.send({
      type: "broadcast",
      event: "force_reveal",
      payload: {},
    });
  }

  endGame() {
    if (!this.isHost) return;
    this.channel?.send({
      type: "broadcast",
      event: "end_game",
      payload: {},
    });
  }

  // --- Timer ---

  private startVoteTimer() {
    if (this.voteTimerHandle) clearTimeout(this.voteTimerHandle);
    this.voteTimerHandle = setTimeout(() => {
      // Auto-reveal when timer expires (host triggers)
      if (this.isHost && this.state.round?.phase === "voting") {
        this.triggerReveal();
        this.broadcastState();
      }
    }, 15500); // slight buffer over 15s
  }

  private triggerReveal() {
    if (this.voteTimerHandle) clearTimeout(this.voteTimerHandle);
    if (!this.state.round) return;
    this.state.round.phase = "reveal";
    this.handlers.onPhaseChange?.("reveal");
    this.handlers.onStateChange?.(this.state);
  }

  // --- Leave ---

  async leave() {
    if (this.voteTimerHandle) clearTimeout(this.voteTimerHandle);
    this.channel?.send({
      type: "broadcast",
      event: "player_leave",
      payload: { playerId: this.playerId },
    });
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // --- Stats ---

  computeSuperlatives(): {
    mostTargeted: { player: RoomPlayer; count: number } | null;
    loneWolf: { player: RoomPlayer; count: number } | null;
    psychic: { player: RoomPlayer; count: number } | null;
    voteBreakdown: Map<PlayerId, number>;
  } {
    const players = this.state.players;
    const allVotes = this.state.allVotes;

    // Total votes received per player
    const voteBreakdown = new Map<PlayerId, number>();
    players.forEach((p) => voteBreakdown.set(p.id, 0));

    // Track per-round winners for lone wolf / psychic
    const roundWinners: PlayerId[] = [];
    let loneWolfCounts = new Map<PlayerId, number>();
    let psychicCounts = new Map<PlayerId, number>();
    players.forEach((p) => {
      loneWolfCounts.set(p.id, 0);
      psychicCounts.set(p.id, 0);
    });

    for (const roundVotes of allVotes) {
      // Count votes per target this round
      const roundCounts = new Map<PlayerId, number>();
      for (const v of roundVotes) {
        voteBreakdown.set(v.targetId, (voteBreakdown.get(v.targetId) ?? 0) + 1);
        roundCounts.set(v.targetId, (roundCounts.get(v.targetId) ?? 0) + 1);
      }

      // Find the majority vote this round
      let maxVotes = 0;
      let majorityTarget: PlayerId | null = null;
      roundCounts.forEach((count, targetId) => {
        if (count > maxVotes) {
          maxVotes = count;
          majorityTarget = targetId;
        }
      });

      if (majorityTarget) {
        roundWinners.push(majorityTarget);

        // Check each voter
        for (const v of roundVotes) {
          if (v.targetId === majorityTarget) {
            psychicCounts.set(v.voterId, (psychicCounts.get(v.voterId) ?? 0) + 1);
          } else {
            loneWolfCounts.set(v.voterId, (loneWolfCounts.get(v.voterId) ?? 0) + 1);
          }
        }
      }
    }

    // Most Targeted
    let mostTargeted: { player: RoomPlayer; count: number } | null = null;
    voteBreakdown.forEach((count, playerId) => {
      if (!mostTargeted || count > mostTargeted.count) {
        const player = players.find((p) => p.id === playerId);
        if (player) mostTargeted = { player, count };
      }
    });

    // Lone Wolf
    let loneWolf: { player: RoomPlayer; count: number } | null = null;
    loneWolfCounts.forEach((count, playerId) => {
      if (!loneWolf || count > loneWolf.count) {
        const player = players.find((p) => p.id === playerId);
        if (player) loneWolf = { player, count };
      }
    });

    // Psychic
    let psychic: { player: RoomPlayer; count: number } | null = null;
    psychicCounts.forEach((count, playerId) => {
      if (!psychic || count > psychic.count) {
        const player = players.find((p) => p.id === playerId);
        if (player) psychic = { player, count };
      }
    });

    return { mostTargeted, loneWolf, psychic, voteBreakdown };
  }
}

// --- Vote Result Helpers ---

export function getVoteResults(votes: Vote[], players: RoomPlayer[]) {
  const counts = new Map<PlayerId, number>();
  players.forEach((p) => counts.set(p.id, 0));
  votes.forEach((v) => counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1));

  let maxVotes = 0;
  counts.forEach((c) => {
    if (c > maxVotes) maxVotes = c;
  });

  const winners = players.filter((p) => (counts.get(p.id) ?? 0) === maxVotes && maxVotes > 0);
  const isTie = winners.length > 1;

  // Who voted for whom
  const voteMap = new Map<PlayerId, PlayerId>();
  votes.forEach((v) => voteMap.set(v.voterId, v.targetId));

  return { counts, winners, isTie, maxVotes, voteMap };
}
