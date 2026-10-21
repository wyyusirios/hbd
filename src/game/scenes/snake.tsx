"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_SPACE } from "../pixel/backgrounds";
import { sfx } from "../sound";
import { useGame } from "../state";
import { Btn, NextButton, Panel, Success } from "../ui/kit";
import { Scene } from "../ui/Scene";

/* ---------- Змейка: собрать 10 сердечек ---------- */

const COLS = 24;
const ROWS = 16;
const CELL = 8;
const GOAL = 10;
const TICK_MS = 130;

type P = { x: number; y: number };
type Status = "ready" | "play" | "dead" | "won";

const HEART = [".xx.xx.", "xxxxxxx", "xxxxxxx", ".xxxxx.", "..xxx..", "...x..."];
const PORTAL_COLORS = ["#b49cff", "#7b5cff", "#ff8fb3", "#6fd6ff", "#5a3fd8"];

const KEYS: Record<string, P> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

function freshSnake(): P[] {
  return [
    { x: 7, y: 8 },
    { x: 6, y: 8 },
    { x: 5, y: 8 },
  ];
}

function spawnHeart(snake: P[]): P {
  for (;;) {
    const h = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
    if (!snake.some((s) => s.x === h.x && s.y === h.y)) return h;
  }
}

export function SnakeGame() {
  const g = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);

  // Mutable game state lives in a ref so the animation loop never sees stale values.
  const game = useRef({
    snake: freshSnake(),
    dir: { x: 1, y: 0 } as P,
    queue: [] as P[],
    heart: { x: 16, y: 8 } as P,
    score: 0,
    status: "ready" as Status,
    last: 0,
    winAt: 0,
  });

  const setBoth = useCallback((s: Status) => {
    game.current.status = s;
    setStatus(s);
  }, []);

  const restart = useCallback(() => {
    const st = game.current;
    st.snake = freshSnake();
    st.dir = { x: 1, y: 0 };
    st.queue = [];
    st.heart = spawnHeart(st.snake);
    st.score = 0;
    setScore(0);
    setBoth("play");
  }, [setBoth]);

  const turn = useCallback(
    (d: P) => {
      const st = game.current;
      if (st.status === "won") return;
      if (st.status === "ready" || st.status === "dead") {
        restart();
        if (d.x === -1) return; // don't start by reversing into the body
      }
      const lastDir = st.queue[st.queue.length - 1] ?? st.dir;
      if (lastDir.x === -d.x && lastDir.y === -d.y) return;
      if (lastDir.x === d.x && lastDir.y === d.y) return;
      if (st.queue.length < 3) st.queue.push(d);
    },
    [restart],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.code];
      if (d) {
        e.preventDefault();
        turn(d);
      } else if ((e.code === "Space" || e.code === "Enter") && game.current.status === "dead") {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn, restart]);

  const { give } = g;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;

    const step = () => {
      const st = game.current;
      if (st.queue.length) st.dir = st.queue.shift()!;
      const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      const hitSelf = st.snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        sfx.wrong();
        setBoth("dead");
        return;
      }
      st.snake.unshift(head);
      if (head.x === st.heart.x && head.y === st.heart.y) {
        st.score += 1;
        setScore(st.score);
        if (st.score >= GOAL) {
          sfx.magic();
          st.winAt = performance.now();
          setBoth("won");
          give("pass");
          return;
        }
        sfx.item();
        st.heart = spawnHeart(st.snake);
      } else {
        st.snake.pop();
      }
    };

    const draw = (now: number) => {
      const st = game.current;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#140d3a" : "#110b31";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }

      if (st.status === "won") {
        drawPortal(ctx, (now - st.winAt) / 1000);
        return;
      }

      // Heart, gently pulsing.
      const pulse = Math.sin(now / 180) > 0;
      HEART.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] !== "x") continue;
          ctx.fillStyle = rx === 1 && ry === 1 ? "#ffffff" : pulse ? "#ff8fb3" : "#ff6fa0";
          ctx.fillRect(st.heart.x * CELL + rx, st.heart.y * CELL + 1 + ry, 1, 1);
        }
      });

      // Snake: lavender head fading to violet.
      st.snake.forEach((s, i) => {
        const t = i / Math.max(st.snake.length - 1, 1);
        ctx.fillStyle = "#0d0a1c";
        ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL);
        ctx.fillStyle = i === 0 ? "#d9ccff" : t < 0.5 ? "#b49cff" : "#8f7fe0";
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
        if (i > 0) {
          ctx.fillStyle = "#7b5cff";
          ctx.fillRect(s.x * CELL + 3, s.y * CELL + 3, 2, 2);
        }
      });
      const h = st.snake[0];
      const d = st.dir;
      ctx.fillStyle = "#0d0a1c";
      const ex = h.x * CELL + 3 + d.x * 2;
      const ey = h.y * CELL + 3 + d.y * 2;
      if (d.x !== 0) {
        ctx.fillRect(ex, ey - 2, 1, 2);
        ctx.fillRect(ex, ey + 2, 1, 2);
      } else {
        ctx.fillRect(ex - 2, ey, 2, 1);
        ctx.fillRect(ex + 2, ey, 2, 1);
      }

      if (st.status === "dead") {
        ctx.fillStyle = "rgba(8, 5, 24, 0.6)";
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const st = game.current;
      if (st.status === "play" && now - st.last >= TICK_MS) {
        st.last = now;
        step();
      }
      draw(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [give, setBoth]);

  // Swipe controls for phones.
  const touch = useRef<P | null>(null);

  return (
    <Scene
      bg={CHAT_SPACE}
      panelPos="center"
      panel={
        <Panel className="snake-panel">
          <div className="snake-head">
            <p className="lead">Собери 10 сердечек, чтобы открыть пропуск на следующий этап. Управление — стрелки или WASD.</p>
            <div className="snake-score">
              ♡ {score}/{GOAL}
            </div>
          </div>
          <div className={`snake-board ${status === "won" ? "flash-violet" : ""}`}>
            <canvas
              ref={canvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              onPointerDown={(e) => {
                touch.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                const start = touch.current;
                touch.current = null;
                if (!start) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
                  if (game.current.status !== "play" && game.current.status !== "won") restart();
                  return;
                }
                turn(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
              }}
            />
            {status === "ready" && <div className="snake-overlay won">Нажми стрелку, чтобы начать</div>}
            {status === "dead" && (
              <div className="snake-overlay">
                <span>Ой! Змейка врезалась.</span>
                <Btn className="primary small" onClick={restart}>
                  Начать заново
                </Btn>
              </div>
            )}
            {status === "won" && <div className="snake-overlay won">Портал открыт!</div>}
          </div>
          {status !== "won" ? (
            <div className="dpad" aria-label="Кнопки управления">
              <button type="button" className="up" onClick={() => turn({ x: 0, y: -1 })} aria-label="Вверх">▲</button>
              <button type="button" className="left" onClick={() => turn({ x: -1, y: 0 })} aria-label="Влево">◀</button>
              <button type="button" className="down" onClick={() => turn({ x: 0, y: 1 })} aria-label="Вниз">▼</button>
              <button type="button" className="right" onClick={() => turn({ x: 1, y: 0 })} aria-label="Вправо">▶</button>
            </div>
          ) : (
            <Success>
              Десять сердечек! Пропуск получен, портал ведёт в прошлое.
              <NextButton label="Войти в портал" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/** Swirling pixel portal in the middle of the board. */
function drawPortal(ctx: CanvasRenderingContext2D, t: number) {
  const cx = (COLS * CELL) / 2;
  const cy = (ROWS * CELL) / 2;
  const grow = Math.min(1, t / 0.8);
  const rx = 34 * grow;
  const ry = 46 * grow;
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2);
      if (d > 1) continue;
      const angle = Math.atan2(y, x);
      const band = Math.floor(d * 6 - t * 4 + angle * 1.2);
      ctx.fillStyle = PORTAL_COLORS[((band % PORTAL_COLORS.length) + PORTAL_COLORS.length) % PORTAL_COLORS.length];
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
  ctx.fillStyle = "#fff4ff";
  ctx.fillRect(Math.round(cx - 3 * grow), Math.round(cy - 5 * grow), Math.round(6 * grow), Math.round(10 * grow));
  // Sparkles orbiting the portal.
  for (let i = 0; i < 10; i++) {
    const a = t * 1.5 + (i * Math.PI * 2) / 10;
    ctx.fillStyle = i % 2 ? "#ffd27a" : "#ffffff";
    ctx.fillRect(Math.round(cx + Math.cos(a) * (rx + 8)), Math.round(cy + Math.sin(a) * (ry + 6)), 2, 2);
  }
}
