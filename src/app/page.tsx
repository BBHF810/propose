'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Player, WordCard, PeerMessage, createInitialGameState, serializeGameState, deserializeGameState } from '@/lib/gameState';
import { PeerManager } from '@/lib/peerManager';
import { generateRoomId, createPlayer, setupGame, submitProposal, handleTimeUp, nextPresenter, selectWinner, nextRound, getScores } from '@/lib/gameLogic';
import TopPage from '@/components/TopPage';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import PresentationView from '@/components/PresentationView';
import JudgeView from '@/components/JudgeView';
import ResultView from '@/components/ResultView';
import GameOverView from '@/components/GameOverView';
import Particles from '@/components/Particles';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const peerRef = useRef<PeerManager | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const myPlayerIdRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      peerRef.current?.destroy();
    };
  }, []);

  // Timer logic (host only)
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.phase !== 'composing') {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        if (prev.timeRemaining <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          const newState = handleTimeUp(prev);
          peerRef.current?.broadcastGameState(newState);
          return newState;
        }
        const newState = { ...prev, timeRemaining: prev.timeRemaining - 1 };
        peerRef.current?.broadcastGameState(newState);
        return newState;
      });
    }, 1000);
  }, []);

  // Host message handler — uses refs to avoid stale closures
  const handleHostMessage = useCallback((msg: PeerMessage, senderId: string) => {
    if (msg.type === 'player-join') {
      // Handle player-join outside setGameState to properly broadcast after state updates
      setGameState(prev => {
        if (!prev) return prev;
        const existingPlayer = prev.players.find(p => p.id === msg.player.id);
        if (existingPlayer) {
          // Player already exists, just broadcast current state
          setTimeout(() => {
            peerRef.current?.broadcastGameState(gameStateRef.current!);
          }, 200);
          return prev;
        }
        const newState = {
          ...prev,
          players: [...prev.players, msg.player],
        };
        // broadcast AFTER React has committed the new state
        setTimeout(() => {
          peerRef.current?.broadcastGameState(newState);
        }, 200);
        return newState;
      });
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      let newState = prev;

      switch (msg.type) {
        case 'submit-proposal': {
          newState = submitProposal(prev, msg.playerId, msg.proposal);
          peerRef.current?.broadcastGameState(newState);
          break;
        }
        case 'player-update': {
          newState = {
            ...prev,
            players: prev.players.map(p =>
              p.id === msg.player.id ? { ...msg.player, hand: p.hand } : p
            ),
          };
          peerRef.current?.broadcastGameState(newState);
          break;
        }
        case 'next-presenter': {
          newState = nextPresenter(prev);
          peerRef.current?.broadcastGameState(newState);
          break;
        }
        case 'select-winner': {
          if ('winnerId' in msg) {
            newState = selectWinner(prev, msg.winnerId);
            peerRef.current?.broadcastGameState(newState);
          }
          break;
        }
        case 'next-round': {
          newState = nextRound(prev);
          peerRef.current?.broadcastGameState(newState);
          if (newState.phase === 'composing') {
            startTimer();
          }
          break;
        }
        default:
          break;
      }

      return newState;
    });
  }, []);

  // Client message handler — uses ref for myPlayerId to avoid stale closure
  const handleClientMessage = useCallback((msg: PeerMessage, _senderId: string) => {
    switch (msg.type) {
      case 'game-state': {
        const newState = deserializeGameState(msg.state);
        setGameState(prev => {
          const currentMyId = myPlayerIdRef.current;
          // Preserve our own hand if we are a non-judge player
          if (prev && currentMyId) {
            const myPlayerInNew = newState.players.find(p => p.id === currentMyId);
            const myPlayerInOld = prev.players.find(p => p.id === currentMyId);
            if (myPlayerInNew && myPlayerInOld && myPlayerInOld.hand.length > 0 && myPlayerInNew.hand.length === 0) {
              newState.players = newState.players.map(p =>
                p.id === currentMyId ? { ...p, hand: myPlayerInOld.hand } : p
              );
            }
          }
          return newState;
        });
        break;
      }
      default:
        break;
    }
  }, []); // No dependencies — uses ref instead

  // Create room
  const handleCreateRoom = useCallback(async (playerName: string) => {
    setError('');
    setIsConnecting(true);
    try {
      const roomId = generateRoomId();
      const peer = new PeerManager();
      peerRef.current = peer;

      await peer.initAsHost(roomId);
      
      const playerId = peer.getPeerId();
      const player = createPlayer(playerId, playerName, true);
      
      const initialState = createInitialGameState(roomId);
      initialState.players = [player];

      // Set refs immediately (state updates are async)
      myPlayerIdRef.current = playerId;
      
      setMyPlayerId(playerId);
      setIsHost(true);
      setGameState(initialState);

      peer.setOnMessage(handleHostMessage);
      peer.setOnConnect((peerId) => {
        console.log('Player connected:', peerId);
      });
      peer.setOnDisconnect((peerId) => {
        setGameState(prev => {
          if (!prev) return prev;
          const newState = {
            ...prev,
            players: prev.players.filter(p => p.id !== peerId),
          };
          peerRef.current?.broadcastGameState(newState);
          return newState;
        });
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '部屋の作成に失敗しました。');
    } finally {
      setIsConnecting(false);
    }
  }, [handleHostMessage]);

  // Join room
  const handleJoinRoom = useCallback(async (roomId: string, playerName: string) => {
    setError('');
    setIsConnecting(true);
    try {
      const peer = new PeerManager();
      peerRef.current = peer;

      // Set message handler BEFORE connecting so it's ready when messages arrive
      peer.setOnMessage(handleClientMessage);

      await peer.initAsClient(roomId.toUpperCase());
      
      const playerId = peer.getPeerId();
      const player = createPlayer(playerId, playerName, false);

      // Set ref immediately
      myPlayerIdRef.current = playerId;

      setMyPlayerId(playerId);
      setIsHost(false);

      const initialState = createInitialGameState(roomId.toUpperCase());
      initialState.players = [player];
      setGameState(initialState);

      // Send join message to host with a small delay to ensure host has handlers ready
      setTimeout(() => {
        peer.sendToHost({ type: 'player-join', player });
      }, 300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '部屋への参加に失敗しました。');
      peerRef.current?.destroy();
      peerRef.current = null;
    } finally {
      setIsConnecting(false);
    }
  }, [handleClientMessage]);

  // Start game (host only)
  const handleStartGame = useCallback(() => {
    if (!gameState || !isHost) return;
    const newState = setupGame(gameState);
    setGameState(newState);
    peerRef.current?.broadcastGameState(newState);
    startTimer();
  }, [gameState, isHost, startTimer]);

  // Submit proposal
  const handleSubmitProposal = useCallback((proposal: WordCard[]) => {
    if (!gameState) return;
    if (isHost) {
      const newState = submitProposal(gameState, myPlayerId, proposal);
      setGameState(newState);
      peerRef.current?.broadcastGameState(newState);
    } else {
      peerRef.current?.sendToHost({
        type: 'submit-proposal',
        playerId: myPlayerId,
        proposal,
      });
    }
  }, [gameState, isHost, myPlayerId]);

  // Next presenter (host/judge only)
  const handleNextPresenter = useCallback(() => {
    if (!gameState) return;
    if (isHost) {
      const newState = nextPresenter(gameState);
      setGameState(newState);
      peerRef.current?.broadcastGameState(newState);
    } else {
      peerRef.current?.sendToHost({ type: 'next-presenter' });
    }
  }, [gameState, isHost]);

  // Select winner (host/judge only)
  const handleSelectWinner = useCallback((winnerId: string) => {
    if (!gameState) return;
    if (isHost) {
      const newState = selectWinner(gameState, winnerId);
      setGameState(newState);
      peerRef.current?.broadcastGameState(newState);
    } else {
      peerRef.current?.sendToHost({ type: 'select-winner', winnerId });
    }
  }, [gameState, isHost]);

  // Next round (host/judge only)
  const handleNextRound = useCallback(() => {
    if (!gameState) return;
    if (isHost) {
      const newState = nextRound(gameState);
      setGameState(newState);
      peerRef.current?.broadcastGameState(newState);
      if (newState.phase === 'composing') {
        startTimer();
      }
    } else {
      peerRef.current?.sendToHost({ type: 'next-round' });
    }
  }, [gameState, isHost, startTimer]);

  // Back to top
  const handleBackToTop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    peerRef.current?.destroy();
    peerRef.current = null;
    setGameState(null);
    setMyPlayerId('');
    myPlayerIdRef.current = '';
    setIsHost(false);
    setError('');
  }, []);

  // Determine current player
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const isJudge = gameState ? gameState.players[gameState.currentJudgeIndex]?.id === myPlayerId : false;

  // Render based on game phase
  const renderContent = () => {
    if (!gameState) {
      return (
        <TopPage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
          isConnecting={isConnecting}
        />
      );
    }

    switch (gameState.phase) {
      case 'lobby':
        return (
          <Lobby
            gameState={gameState}
            myPlayerId={myPlayerId}
            isHost={isHost}
            onStartGame={handleStartGame}
            onBack={handleBackToTop}
          />
        );

      case 'composing':
        return (
          <GameBoard
            gameState={gameState}
            myPlayerId={myPlayerId}
            isJudge={isJudge}
            onSubmitProposal={handleSubmitProposal}
          />
        );

      case 'presenting':
        return (
          <PresentationView
            gameState={gameState}
            myPlayerId={myPlayerId}
            isHost={isHost}
            isJudge={isJudge}
            onNextPresenter={handleNextPresenter}
          />
        );

      case 'judging':
        return (
          <JudgeView
            gameState={gameState}
            myPlayerId={myPlayerId}
            isJudge={isJudge}
            isHost={isHost}
            onSelectWinner={handleSelectWinner}
          />
        );

      case 'result':
        return (
          <ResultView
            gameState={gameState}
            myPlayerId={myPlayerId}
            isHost={isHost}
            isJudge={isJudge}
            onNextRound={handleNextRound}
          />
        );

      case 'gameover':
        return (
          <GameOverView
            gameState={gameState}
            myPlayerId={myPlayerId}
            onBackToTop={handleBackToTop}
          />
        );

      default:
        return null;
    }
  };

  return (
    <main className="page-container">
      <Particles />
      {renderContent()}
    </main>
  );
}
