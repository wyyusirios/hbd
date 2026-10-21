"use client";

import dynamic from "next/dynamic";

// The game relies on canvas, localStorage and Web Audio, so it renders only in the browser.
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => <div className="boot">loading PROJECT: YOU…</div>,
});

export default function ClientGame() {
  return <Game />;
}
