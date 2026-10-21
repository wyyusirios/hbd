"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ITEMS, SCENES, rewardsBefore, sceneIndex, type ItemId, type SceneId } from "./data";
import { setMuted, sfx } from "./sound";

const SAVE_KEY = "project-you-save-v1";

interface Save {
  /** Furthest story scene the player is on; "title" means a fresh game. */
  progress: SceneId;
  items: ItemId[];
  qualities: string[];
  muted: boolean;
}

const EMPTY: Save = { progress: "title", items: [], qualities: [], muted: false };

function isStory(id: SceneId) {
  return id !== "title" && id !== "gallery";
}

function load(): Save {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<Save>;
    const progress = data.progress && sceneIndex(data.progress) >= 0 ? data.progress : "title";
    return {
      progress,
      items: (data.items ?? []).filter((i): i is ItemId => i in ITEMS),
      qualities: Array.isArray(data.qualities) ? data.qualities.slice(0, 5).map(String) : [],
      muted: Boolean(data.muted),
    };
  } catch {
    return EMPTY;
  }
}

function persist(save: Save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or blocked storage: the game still works, it just won't resume.
  }
}

export interface Toast {
  id: number;
  item: ItemId;
}

interface GameApi {
  scene: SceneId;
  progress: SceneId;
  items: ItemId[];
  qualities: string[];
  muted: boolean;
  debug: boolean;
  toasts: Toast[];
  transitioning: boolean;
  goTo: (id: SceneId) => void;
  next: () => void;
  has: (id: ItemId) => boolean;
  give: (...ids: ItemId[]) => void;
  setQualities: (q: string[]) => void;
  toggleMute: () => void;
  reset: () => void;
  jump: (id: SceneId) => void;
}

const GameContext = createContext<GameApi | null>(null);

export function useGame() {
  const g = useContext(GameContext);
  if (!g) throw new Error("useGame outside provider");
  return g;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(load);
  const [scene, setScene] = useState<SceneId>("title");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const toastId = useRef(0);
  const [debug] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has("debug");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMuted(save.muted);
  }, [save.muted]);

  useEffect(() => {
    persist(save);
  }, [save]);

  const show = useCallback((id: SceneId) => {
    setScene(id);
    if (isStory(id)) setSave((s) => (s.progress === id ? s : { ...s, progress: id }));
    window.scrollTo(0, 0);
  }, []);

  const goTo = useCallback(
    (id: SceneId) => {
      setTransitioning(true);
      window.setTimeout(() => {
        show(id);
        setTransitioning(false);
      }, 450);
    },
    [show],
  );

  const next = useCallback(() => {
    const idx = sceneIndex(scene);
    goTo(SCENES[Math.min(idx + 1, SCENES.length - 1)].id);
  }, [scene, goTo]);

  const has = useCallback((id: ItemId) => save.items.includes(id), [save.items]);

  const itemsRef = useRef(save.items);
  useEffect(() => {
    itemsRef.current = save.items;
  }, [save.items]);

  const give = useCallback((...ids: ItemId[]) => {
    const fresh = ids.filter((i) => !itemsRef.current.includes(i));
    if (fresh.length === 0) return;
    itemsRef.current = [...itemsRef.current, ...fresh];
    setSave((s) => ({ ...s, items: Array.from(new Set([...s.items, ...fresh])) }));
    setToasts((t) => [...t, ...fresh.map((item) => ({ id: ++toastId.current, item }))]);
    sfx.item();
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => setToasts((t) => t.slice(1)), 2400);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const setQualities = useCallback((q: string[]) => setSave((s) => ({ ...s, qualities: q })), []);
  const toggleMute = useCallback(() => setSave((s) => ({ ...s, muted: !s.muted })), []);

  const reset = useCallback(() => {
    setSave((s) => ({ ...EMPTY, muted: s.muted }));
    setToasts([]);
  }, []);

  const jump = useCallback(
    (id: SceneId) => {
      setSave((s) => ({ ...s, items: Array.from(new Set([...s.items, ...rewardsBefore(id)])) }));
      show(id);
    },
    [show],
  );

  const api = useMemo<GameApi>(
    () => ({
      scene,
      progress: save.progress,
      items: save.items,
      qualities: save.qualities,
      muted: save.muted,
      debug,
      toasts,
      transitioning,
      goTo,
      next,
      has,
      give,
      setQualities,
      toggleMute,
      reset,
      jump,
    }),
    [scene, save, debug, toasts, transitioning, goTo, next, has, give, setQualities, toggleMute, reset, jump],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}
