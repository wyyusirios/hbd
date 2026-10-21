"use client";

import type { ComponentType } from "react";
import type { SceneId } from "./data";
import { GameProvider, useGame } from "./state";
import { Hud, Toasts } from "./ui/Hud";
import { Desktop, Terminal, Title } from "./scenes/prologue";
import { Level1, Level2, Level3 } from "./scenes/chapter1";
import { Level4, Level5, Level6, Level7 } from "./scenes/chapter2";
import { Level8, Level9, Level10, Level11, Level12 } from "./scenes/chapter3";
import { Level13, Level14, Level15, Level16 } from "./scenes/chapter4";
import { Finale, HomeFound, Level17 } from "./scenes/chapter5";
import { Gallery } from "./scenes/gallery";
import { Caesar, CodeLine, Question, Search } from "./scenes/quests";
import { SnakeGame } from "./scenes/snake";

const SCENE_COMPONENTS: Record<SceneId, ComponentType> = {
  title: Title,
  desktop: Desktop,
  terminal: Terminal,
  l1: Level1,
  search: Search,
  l2: Level2,
  l3: Level3,
  l4: Level4,
  l5: Level5,
  l6: Level6,
  caesar: Caesar,
  l7: Level7,
  snake: SnakeGame,
  l8: Level8,
  l9: Level9,
  question: Question,
  l10: Level10,
  l11: Level11,
  l12: Level12,
  l13: Level13,
  l14: Level14,
  l15: Level15,
  l16: Level16,
  code: CodeLine,
  l17: Level17,
  home: HomeFound,
  l18: Finale,
  gallery: Gallery,
};

function Current() {
  const g = useGame();
  const SceneComponent = SCENE_COMPONENTS[g.scene];
  return (
    <div className={`game ${g.transitioning ? "leaving" : ""}`}>
      <div key={g.scene} className="scene-enter">
        <SceneComponent />
      </div>
      <Hud />
      <Toasts />
    </div>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <Current />
    </GameProvider>
  );
}
