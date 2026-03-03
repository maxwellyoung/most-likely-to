import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  BounceIn,
  SlideInRight,
  SlideInLeft,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import {
  MultiplayerRoom,
  RoomPlayer,
  RoomState,
  GamePhase,
  PlayerId,
  getVoteResults,
} from "../lib/multiplayer";
import promptData from "../assets/prompts/prompts.json";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_WIDTH = 500;
const VOTE_TIMER_SECONDS = 15;

const REACTION_EMOJIS = ["😂", "💀", "🔥", "😱", "👀", "🤣", "😭", "🫡"];

// --- Haptic helper (same as main game) ---
const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "error") => {
  if (Platform.OS === "web") return;
  switch (type) {
    case "light": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case "medium": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case "heavy": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case "success": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case "error": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
  }
};

// --- Floating Reaction ---
const FloatingReaction = ({ emoji, id }: { emoji: string; id: number }) => {
  const startX = useMemo(() => Math.random() * (SCREEN_WIDTH - 60) + 30, []);

  return (
    <Animated.Text
      entering={FadeIn.duration(200)}
      style={[styles.floatingReaction, { left: startX }]}
    >
      {emoji}
    </Animated.Text>
  );
};

// --- Prompt Pool ---
function getShuffledPrompts(): string[] {
  const rawPrompts = Array.isArray(promptData) ? promptData : (promptData as any).prompts ?? [];
  const prompts = rawPrompts
    .filter((p: any) => p.type === "group" || !p.type)
    .map((p: any) => p.text);
  // Fisher-Yates shuffle
  for (let i = prompts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
  }
  return prompts;
}

// --- Main Component ---

interface MultiplayerGameProps {
  onBack: () => void;
}

type Screen = "entry" | "lobby" | "voting" | "reveal" | "superlatives";

export function MultiplayerGame({ onBack }: MultiplayerGameProps) {
  const roomRef = useRef<MultiplayerRoom>(new MultiplayerRoom());
  const promptPoolRef = useRef<string[]>([]);
  const promptIdxRef = useRef(0);

  const [screen, setScreen] = useState<Screen>("entry");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [roundNumber, setRoundNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(10);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PlayerId | null>(null);
  const [voteResults, setVoteResults] = useState<ReturnType<typeof getVoteResults> | null>(null);
  const [reactions, setReactions] = useState<{ emoji: string; id: number }[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(VOTE_TIMER_SECONDS);
  const [joinError, setJoinError] = useState("");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [superlatives, setSuperlatives] = useState<ReturnType<MultiplayerRoom["computeSuperlatives"]> | null>(null);
  const [voteCount, setVoteCount] = useState(0);

  const reactionIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerProgress = useSharedValue(1);
  const timerPulse = useSharedValue(1);

  const room = roomRef.current;

  // --- Setup Room Event Handlers ---
  useEffect(() => {
    room.on("onStateChange", (state: RoomState) => {
      setPlayers([...state.players]);
      if (state.round) {
        setCurrentPrompt(state.round.promptText);
        setRoundNumber(state.round.roundNumber);
        setTotalRounds(state.round.totalRounds);
        setVoteCount(state.round.votes.length);

        if (state.round.phase === "reveal") {
          const results = getVoteResults(state.round.votes, state.players);
          setVoteResults(results);
        }
      }
    });

    room.on("onPhaseChange", (newPhase: GamePhase) => {
      setPhase(newPhase);
      if (newPhase === "voting") {
        setScreen("voting");
        setHasVoted(false);
        setSelectedTarget(null);
        setVoteResults(null);
        startTimer();
        triggerHaptic("medium");
      } else if (newPhase === "reveal") {
        setScreen("reveal");
        stopTimer();
        triggerHaptic("success");
      } else if (newPhase === "superlatives") {
        const stats = room.computeSuperlatives();
        setSuperlatives(stats);
        setScreen("superlatives");
        triggerHaptic("success");
      }
    });

    room.on("onReaction", (emoji: string, playerName: string) => {
      const id = reactionIdRef.current++;
      setReactions((prev) => [...prev.slice(-20), { emoji, id }]);
      // Auto-remove after animation
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);
    });

    room.on("onPlayerJoined", (player: RoomPlayer) => {
      console.log(`[SFX] Player joined: ${player.name}`);
      triggerHaptic("light");
    });

    room.on("onPlayerLeft", (name: string) => {
      console.log(`[SFX] Player left: ${name}`);
    });

    return () => {
      room.leave();
      stopTimer();
    };
  }, []);

  // --- Timer ---
  const startTimer = useCallback(() => {
    setTimerSeconds(VOTE_TIMER_SECONDS);
    timerProgress.value = 1;
    timerProgress.value = withTiming(0, {
      duration: VOTE_TIMER_SECONDS * 1000,
      easing: Easing.linear,
    });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 5) triggerHaptic("light");
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    cancelAnimation(timerProgress);
  }, []);

  // Timer pulse when low
  useEffect(() => {
    if (screen === "voting" && timerSeconds <= 5 && timerSeconds > 0) {
      timerPulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 150 }),
          withTiming(1, { duration: 150 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(timerPulse);
      timerPulse.value = 1;
    }
  }, [timerSeconds, screen]);

  // --- Actions ---

  const handleCreateRoom = useCallback(async () => {
    if (!playerName.trim()) {
      setJoinError("Enter your name first");
      return;
    }
    triggerHaptic("success");
    promptPoolRef.current = getShuffledPrompts();
    promptIdxRef.current = 0;
    const code = await room.createRoom(playerName.trim());
    setRoomCode(code);
    setScreen("lobby");
  }, [playerName]);

  const handleJoinRoom = useCallback(async () => {
    if (!playerName.trim()) {
      setJoinError("Enter your name first");
      return;
    }
    if (joinCode.length !== 4) {
      setJoinError("Room code must be 4 letters");
      return;
    }
    triggerHaptic("medium");
    setJoinError("");
    try {
      await room.joinRoom(joinCode.toUpperCase(), playerName.trim());
      setRoomCode(joinCode.toUpperCase());
      setScreen("lobby");
    } catch (e: any) {
      setJoinError(e.message || "Could not join room");
    }
  }, [playerName, joinCode]);

  const handleStartGame = useCallback(() => {
    if (!room.isHost) return;
    if (players.length < 2) {
      triggerHaptic("error");
      return;
    }
    const prompts = promptPoolRef.current;
    if (prompts.length === 0) {
      promptPoolRef.current = getShuffledPrompts();
    }
    const prompt = promptPoolRef.current[promptIdxRef.current] || "Most likely to do something unexpected";
    room.startGame(prompt, promptIdxRef.current, totalRounds);
    promptIdxRef.current++;
  }, [players, totalRounds]);

  const handleVote = useCallback(
    (targetId: PlayerId) => {
      if (hasVoted) return;
      setSelectedTarget(targetId);
      setHasVoted(true);
      room.submitVote(targetId);
      triggerHaptic("success");
      console.log("[SFX] Vote submitted");
    },
    [hasVoted]
  );

  const handleNextRound = useCallback(() => {
    if (!room.isHost) return;
    const nextRound = roundNumber + 1;
    if (nextRound > totalRounds) {
      room.endGame();
      return;
    }
    const prompt =
      promptPoolRef.current[promptIdxRef.current] ||
      "Most likely to surprise everyone";
    room.nextRound(prompt, promptIdxRef.current, nextRound, totalRounds);
    promptIdxRef.current++;
  }, [roundNumber, totalRounds]);

  const handleSendReaction = useCallback((emoji: string) => {
    room.sendReaction(emoji);
    triggerHaptic("light");
  }, []);

  const handleLeave = useCallback(async () => {
    await room.leave();
    onBack();
  }, [onBack]);

  const handleShareResults = useCallback(async () => {
    if (!superlatives) return;
    triggerHaptic("success");
    let msg = "🫵 MOST LIKELY TO — MULTIPLAYER RESULTS\n\n";
    if (superlatives.mostTargeted) {
      msg += `🎯 Most Targeted: ${superlatives.mostTargeted.player.avatar} ${superlatives.mostTargeted.player.name} (${superlatives.mostTargeted.count} votes)\n`;
    }
    if (superlatives.loneWolf) {
      msg += `🐺 Lone Wolf: ${superlatives.loneWolf.player.avatar} ${superlatives.loneWolf.player.name}\n`;
    }
    if (superlatives.psychic) {
      msg += `🔮 Psychic: ${superlatives.psychic.player.avatar} ${superlatives.psychic.player.name}\n`;
    }
    msg += `\n🎮 Play at mostlikelyto.ninetynine.digital`;
    try {
      await Share.share({ message: msg });
    } catch {}
  }, [superlatives]);

  // --- Animated Styles ---
  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const timerTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  // --- Renders ---

  const renderEntry = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.entryContent}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.entryHero}>
        <Text style={styles.entryEmoji}>🫵</Text>
        <Text style={styles.entryTitle}>MULTIPLAYER</Text>
        <Text style={styles.entrySub}>Everyone votes on their own phone</Text>
      </Animated.View>

      {/* Name Input */}
      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.nameSection}>
        <Text style={styles.fieldLabel}>YOUR NAME</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={{ marginLeft: 16 }} />
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={(t) => { setPlayerName(t); setJoinError(""); }}
            placeholder="Enter your name..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={16}
          />
        </View>
      </Animated.View>

      {/* Create Room */}
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRoom} activeOpacity={0.9}>
          <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Create Room</Text>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Divider */}
      <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </Animated.View>

      {/* Join Room */}
      <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.joinSection}>
        <Text style={styles.fieldLabel}>ROOM CODE</Text>
        <View style={styles.codeInputRow}>
          <View style={[styles.inputWrap, { flex: 1 }]}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={(t) => { setJoinCode(t.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4)); setJoinError(""); }}
              placeholder="ABCD"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={4}
            />
          </View>
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinRoom} activeOpacity={0.9}>
            <LinearGradient colors={["#3B82F6", "#2563EB"]} style={styles.joinButtonGradient}>
              <Text style={styles.buttonText}>Join</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {joinError ? (
        <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
          {joinError}
        </Animated.Text>
      ) : null}
    </ScrollView>
  );

  const renderLobby = () => (
    <View style={styles.screen}>
      <View style={styles.lobbyHeader}>
        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.roomCodeBadge}>
          <Text style={styles.roomCodeLabel}>ROOM</Text>
          <Text style={styles.roomCodeText}>{roomCode}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.lobbyContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.lobbyHero}>
          <Text style={styles.lobbyTitle}>Waiting for players...</Text>
          <Text style={styles.lobbySub}>
            Share the code <Text style={styles.codeHighlight}>{roomCode}</Text> with your friends
          </Text>
        </Animated.View>

        <View style={styles.playerGrid}>
          {players.map((p, i) => (
            <Animated.View
              key={p.id}
              entering={ZoomIn.delay(i * 80).duration(300)}
              style={styles.lobbyPlayerCard}
            >
              <Text style={styles.lobbyPlayerAvatar}>{p.avatar}</Text>
              <Text style={styles.lobbyPlayerName}>{p.name}</Text>
              {p.isHost && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              )}
              {p.id === room.myId && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {room.isHost && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.hostControls}>
            {/* Round count selector */}
            <View style={styles.roundSelector}>
              <Text style={styles.roundSelectorLabel}>Rounds</Text>
              <View style={styles.roundSelectorRow}>
                {[5, 10, 15, 20].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.roundOption, totalRounds === n && styles.roundOptionActive]}
                    onPress={() => { setTotalRounds(n); triggerHaptic("light"); }}
                  >
                    <Text style={[styles.roundOptionText, totalRounds === n && styles.roundOptionTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, players.length < 2 && styles.buttonDisabled]}
              onPress={handleStartGame}
              activeOpacity={0.9}
              disabled={players.length < 2}
            >
              <LinearGradient
                colors={players.length < 2 ? ["#555", "#444"] : ["#F97316", "#EA580C"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {players.length < 2 ? `Need ${2 - players.length} more` : "Start Game 🎲"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!room.isHost && (
          <Animated.View entering={FadeIn.delay(400).duration(300)} style={styles.waitingMessage}>
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );

  const renderVoting = () => {
    const otherPlayers = players; // vote for anyone including yourself

    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#F9731615", "#000"]} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.votingHeader}>
          <View style={styles.roundBadge}>
            <Text style={styles.roundBadgeText}>
              {roundNumber}/{totalRounds}
            </Text>
          </View>
          <Animated.View style={timerTextStyle}>
            <Text style={[styles.timerText, timerSeconds <= 5 && styles.timerTextUrgent]}>
              {timerSeconds}s
            </Text>
          </Animated.View>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              timerBarStyle,
              { backgroundColor: timerSeconds <= 5 ? "#EF4444" : "#F97316" },
            ]}
          />
        </View>

        {/* Prompt */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.promptCard}>
          <Text style={styles.promptLabel}>WHO IS MOST LIKELY TO...</Text>
          <Text style={styles.promptText}>{currentPrompt}</Text>
        </Animated.View>

        {/* Vote Buttons */}
        <ScrollView contentContainerStyle={styles.voteGrid} showsVerticalScrollIndicator={false}>
          {hasVoted ? (
            <Animated.View entering={ZoomIn.duration(300)} style={styles.votedMessage}>
              <Text style={styles.votedEmoji}>✅</Text>
              <Text style={styles.votedText}>Vote locked in!</Text>
              <Text style={styles.votedSub}>
                {voteCount}/{players.length} voted
              </Text>
            </Animated.View>
          ) : (
            otherPlayers.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInUp.delay(i * 60).duration(300)}>
                <TouchableOpacity
                  style={[
                    styles.voteCard,
                    selectedTarget === p.id && styles.voteCardSelected,
                  ]}
                  onPress={() => handleVote(p.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.voteAvatar}>{p.avatar}</Text>
                  <Text style={styles.voteName}>{p.name}</Text>
                  {p.id === room.myId && <Text style={styles.voteYouTag}>(you)</Text>}
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderReveal = () => {
    if (!voteResults) return null;
    const { winners, isTie, counts, voteMap } = voteResults;

    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#FFD70020", "#000"]} style={StyleSheet.absoluteFill} />

        <ScrollView contentContainerStyle={styles.revealContent} showsVerticalScrollIndicator={false}>
          {/* Winners */}
          <Animated.View entering={ZoomIn.duration(500)} style={styles.revealWinnerSection}>
            {isTie && (
              <Animated.Text entering={FadeIn.delay(200)} style={styles.tieText}>
                IT'S A TIE!
              </Animated.Text>
            )}
            <View style={styles.winnersRow}>
              {winners.map((w, i) => (
                <Animated.View
                  key={w.id}
                  entering={BounceIn.delay(300 + i * 200).duration(600)}
                  style={styles.revealWinnerCard}
                >
                  <Text style={styles.revealWinnerEmoji}>{w.avatar}</Text>
                  <Text style={styles.revealWinnerName}>{w.name}</Text>
                  <Text style={styles.revealWinnerVotes}>
                    {counts.get(w.id) ?? 0} vote{(counts.get(w.id) ?? 0) !== 1 ? "s" : ""}
                  </Text>
                  <Animated.View
                    entering={FadeIn.delay(800)}
                    style={styles.drinkBadge}
                  >
                    <Text style={styles.drinkBadgeText}>🍺 DRINKS!</Text>
                  </Animated.View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Prompt reminder */}
          <Animated.View entering={FadeIn.delay(600)} style={styles.revealPrompt}>
            <Text style={styles.revealPromptLabel}>The prompt was:</Text>
            <Text style={styles.revealPromptText}>{currentPrompt}</Text>
          </Animated.View>

          {/* Vote Breakdown */}
          <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>Who voted for whom</Text>
            {players.map((voter, i) => {
              const targetId = voteMap.get(voter.id);
              const target = players.find((p) => p.id === targetId);
              return (
                <Animated.View
                  key={voter.id}
                  entering={SlideInLeft.delay(900 + i * 80).duration(300)}
                  style={styles.breakdownRow}
                >
                  <Text style={styles.breakdownVoter}>
                    {voter.avatar} {voter.name}
                  </Text>
                  <Text style={styles.breakdownArrow}>→</Text>
                  <Text style={styles.breakdownTarget}>
                    {target ? `${target.avatar} ${target.name}` : "🤷 Didn't vote"}
                  </Text>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Reactions */}
          <Animated.View entering={FadeIn.delay(1200)} style={styles.reactionBar}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleSendReaction(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Next / End */}
          {room.isHost && (
            <Animated.View entering={FadeInUp.delay(1400).duration(400)}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleNextRound} activeOpacity={0.9}>
                <LinearGradient
                  colors={roundNumber >= totalRounds ? ["#10B981", "#059669"] : ["#F97316", "#EA580C"]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {roundNumber >= totalRounds ? "See Results 🏆" : "Next Round →"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!room.isHost && (
            <Animated.View entering={FadeIn.delay(1400)} style={styles.waitingMessage}>
              <Text style={styles.waitingText}>
                {roundNumber >= totalRounds
                  ? "Waiting for host to show results..."
                  : "Waiting for next round..."}
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Floating Reactions */}
        {reactions.map((r) => (
          <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} />
        ))}
      </View>
    );
  };

  const renderSuperlatives = () => {
    if (!superlatives) return null;

    const awards = [
      {
        title: "MOST TARGETED",
        emoji: "🎯",
        subtitle: "Got voted for the most",
        data: superlatives.mostTargeted,
        color: "#EF4444",
        gradient: ["#EF4444", "#DC2626"] as [string, string],
      },
      {
        title: "LONE WOLF",
        emoji: "🐺",
        subtitle: "Voted differently from everyone",
        data: superlatives.loneWolf,
        color: "#8B5CF6",
        gradient: ["#8B5CF6", "#7C3AED"] as [string, string],
      },
      {
        title: "PSYCHIC",
        emoji: "🔮",
        subtitle: "Voted with the majority most",
        data: superlatives.psychic,
        color: "#10B981",
        gradient: ["#10B981", "#059669"] as [string, string],
      },
    ].filter((a) => a.data);

    return (
      <View style={styles.screen}>
        <LinearGradient colors={["#FFD70015", "#000"]} style={StyleSheet.absoluteFill} />

        <ScrollView contentContainerStyle={styles.superlativesContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text style={styles.superlativesTitle}>🏆 SUPERLATIVES</Text>
            <Text style={styles.superlativesSub}>
              {roundNumber} rounds played with {players.length} players
            </Text>
          </Animated.View>

          {awards.map((award, i) => (
            <Animated.View
              key={award.title}
              entering={ZoomIn.delay(300 + i * 200).duration(400)}
              style={[styles.awardCard, { borderColor: award.color + "40" }]}
            >
              <LinearGradient
                colors={[award.color + "15", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.awardEmoji}>{award.emoji}</Text>
              <Text style={[styles.awardTitle, { color: award.color }]}>{award.title}</Text>
              <Text style={styles.awardSubtitle}>{award.subtitle}</Text>
              <View style={styles.awardPlayerRow}>
                <Text style={styles.awardPlayerAvatar}>{award.data!.player.avatar}</Text>
                <Text style={styles.awardPlayerName}>{award.data!.player.name}</Text>
              </View>
              <Text style={styles.awardStat}>
                {award.data!.count} time{award.data!.count !== 1 ? "s" : ""}
              </Text>
            </Animated.View>
          ))}

          {/* Full Leaderboard */}
          <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.leaderboardSection}>
            <Text style={styles.leaderboardTitle}>Total Votes Received</Text>
            {players
              .map((p) => ({
                player: p,
                count: superlatives.voteBreakdown.get(p.id) ?? 0,
              }))
              .sort((a, b) => b.count - a.count)
              .map((entry, i) => (
                <Animated.View
                  key={entry.player.id}
                  entering={SlideInRight.delay(1000 + i * 60).duration(250)}
                  style={styles.leaderboardRow}
                >
                  <Text style={[styles.leaderboardRank, i === 0 && { color: "#FFD700" }]}>
                    {i + 1}
                  </Text>
                  <Text style={styles.leaderboardAvatar}>{entry.player.avatar}</Text>
                  <Text style={styles.leaderboardName}>{entry.player.name}</Text>
                  <View style={styles.leaderboardBar}>
                    <View
                      style={[
                        styles.leaderboardBarFill,
                        {
                          width: `${Math.max(5, (entry.count / Math.max(1, ...Array.from(superlatives.voteBreakdown.values()))) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.leaderboardCount}>{entry.count}</Text>
                </Animated.View>
              ))}
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInUp.delay(1200).duration(400)} style={styles.endActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareResults} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={22} color="#FFF" />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLeave} activeOpacity={0.9}>
              <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {screen === "entry" && renderEntry()}
      {screen === "lobby" && renderLobby()}
      {screen === "voting" && renderVoting()}
      {screen === "reveal" && renderReveal()}
      {screen === "superlatives" && renderSuperlatives()}
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    maxWidth: Platform.OS === "web" ? MAX_WIDTH : undefined,
    width: "100%",
    alignSelf: "center",
  },
  screen: { flex: 1 },
  scrollContent: { flex: 1 },

  // Entry
  entryContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  entryHero: {
    alignItems: "center",
    marginBottom: 40,
  },
  entryEmoji: { fontSize: 64, marginBottom: 16 },
  entryTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
  },
  entrySub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
  },
  nameSection: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 14,
    fontSize: 17,
    color: "#FFF",
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
  buttonDisabled: { opacity: 0.5 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
  },
  joinSection: { marginBottom: 8 },
  codeInputRow: { flexDirection: "row", gap: 12 },
  codeInput: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
  },
  joinButton: {
    width: 80,
    borderRadius: 16,
    overflow: "hidden",
  },
  joinButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },

  // Lobby
  lobbyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  roomCodeBadge: {
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
  },
  roomCodeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(249,115,22,0.7)",
    letterSpacing: 2,
  },
  roomCodeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F97316",
    letterSpacing: 6,
  },
  lobbyContent: {
    padding: 20,
    paddingBottom: 60,
  },
  lobbyHero: {
    alignItems: "center",
    marginBottom: 32,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 8,
  },
  lobbySub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  codeHighlight: {
    color: "#F97316",
    fontWeight: "800",
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginBottom: 32,
  },
  lobbyPlayerCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    maxWidth: (MAX_WIDTH - 64) / 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lobbyPlayerAvatar: { fontSize: 40, marginBottom: 8 },
  lobbyPlayerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  hostBadge: {
    marginTop: 8,
    backgroundColor: "rgba(249,115,22,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F97316",
    letterSpacing: 1,
  },
  youBadge: {
    marginTop: 4,
    backgroundColor: "rgba(59,130,246,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: 1,
  },
  hostControls: {
    gap: 16,
  },
  roundSelector: {
    marginBottom: 8,
  },
  roundSelectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    textAlign: "center",
  },
  roundSelectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  roundOption: {
    width: 52,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  roundOptionActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderColor: "#F97316",
  },
  roundOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  roundOptionTextActive: {
    color: "#F97316",
  },
  waitingMessage: {
    alignItems: "center",
    paddingVertical: 24,
  },
  waitingText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // Voting
  votingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  roundBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roundBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  timerText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F97316",
  },
  timerTextUrgent: {
    color: "#EF4444",
  },
  timerTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  timerFill: {
    height: "100%",
    borderRadius: 2,
  },
  promptCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(249,115,22,0.8)",
    letterSpacing: 2,
    marginBottom: 12,
  },
  promptText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 30,
  },
  voteGrid: {
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  voteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  voteCardSelected: {
    borderColor: "#F97316",
    backgroundColor: "rgba(249,115,22,0.1)",
  },
  voteAvatar: { fontSize: 32 },
  voteName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    flex: 1,
  },
  voteYouTag: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
  votedMessage: {
    alignItems: "center",
    paddingVertical: 40,
  },
  votedEmoji: { fontSize: 48, marginBottom: 12 },
  votedText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  votedSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },

  // Reveal
  revealContent: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 60,
    alignItems: "center",
  },
  revealWinnerSection: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  tieText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F97316",
    letterSpacing: 3,
    marginBottom: 16,
  },
  winnersRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  revealWinnerCard: {
    backgroundColor: "rgba(255,215,0,0.1)",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.3)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    minWidth: 140,
  },
  revealWinnerEmoji: { fontSize: 56, marginBottom: 8 },
  revealWinnerName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 4,
  },
  revealWinnerVotes: {
    fontSize: 14,
    color: "rgba(255,215,0,0.7)",
    fontWeight: "600",
  },
  drinkBadge: {
    marginTop: 12,
    backgroundColor: "rgba(249,115,22,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  drinkBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F97316",
  },
  revealPrompt: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  revealPromptLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
    marginBottom: 6,
  },
  revealPromptText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textAlign: "center",
  },
  breakdownSection: {
    width: "100%",
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginBottom: 6,
    gap: 8,
  },
  breakdownVoter: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    flex: 1,
  },
  breakdownArrow: {
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
  },
  breakdownTarget: {
    fontSize: 14,
    color: "#F97316",
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  // Reactions
  reactionBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmoji: { fontSize: 22 },
  floatingReaction: {
    position: "absolute",
    bottom: 100,
    fontSize: 32,
    opacity: 0.8,
  },

  // Superlatives
  superlativesContent: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 60,
    alignItems: "center",
  },
  superlativesTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 4,
  },
  superlativesSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginBottom: 32,
  },
  awardCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  awardEmoji: { fontSize: 48, marginBottom: 8 },
  awardTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 4,
  },
  awardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
  },
  awardPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  awardPlayerAvatar: { fontSize: 28 },
  awardPlayerName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
  },
  awardStat: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 4,
  },

  // Leaderboard
  leaderboardSection: {
    width: "100%",
    marginTop: 8,
    marginBottom: 24,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 16,
    textAlign: "center",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    marginBottom: 8,
    gap: 10,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    width: 24,
  },
  leaderboardAvatar: { fontSize: 22 },
  leaderboardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    flex: 1,
  },
  leaderboardBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  leaderboardBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#F97316",
  },
  leaderboardCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F97316",
    width: 28,
    textAlign: "right",
  },

  // End actions
  endActions: {
    width: "100%",
    gap: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
