"use client";

import { useEffect, useState } from "react";
import { LEVEL_COUNT } from "../data";
import { WALLPAPER } from "../pixel/backgrounds";
import { Pix } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { Btn, Typewriter } from "../ui/kit";
import { FullScene } from "../ui/Scene";

/* ---------- Экран 1. Ночной город ---------- */

export function Title() {
  const g = useGame();
  const started = g.progress !== "title";
  const [about, setAbout] = useState(false);

  return (
    <FullScene bg="/img/city.webp" className="title-scene">
      <div className="title-shade" />
      <div className="title-swallow">
        <Pix frames={["swallowA", "swallowB"]} name="swallowA" fps={3} size={8} />
      </div>
      <div className="title-box">
        <h1 className="logo">
          PROJECT: <span>YOU</span>
          <span className="logo-heart">♥</span>
        </h1>
        <div className="logo-sub">— для Артёма —</div>
        <p className="title-text">Привет, Артём, предлагаю отправиться со мной в&nbsp;маленькое путешествие. Если готов, открывай файл.</p>
        <div className="title-menu">
          {started ? (
            <>
              <Btn className="primary" onClick={() => g.goTo(g.progress)}>
                ▸ Продолжить
              </Btn>
              {g.progress === "l18" && <Btn onClick={() => g.goTo("gallery")}>Воспоминания</Btn>}
              <Btn
                className="ghost"
                onClick={() => {
                  g.reset();
                  g.goTo("desktop");
                }}
              >
                Начать заново
              </Btn>
            </>
          ) : (
            <Btn className="primary" onClick={() => g.goTo("desktop")}>
              ▸ Начать игру
            </Btn>
          )}
          <Btn className="ghost" onClick={g.toggleMute}>
            Звук: {g.muted ? "выкл" : "вкл"}
          </Btn>
          <Btn className="ghost" onClick={() => setAbout((v) => !v)}>
            О проекте
          </Btn>
        </div>
        {about && (
          <p className="about">
            Пиксельное приключение — уровней: {LEVEL_COUNT}. Нажимай на предметы, решай загадки, собирай вещи в карманы. Прогресс сохраняется сам — можно закрыть и вернуться.
          </p>
        )}
      </div>
      <div className="title-quote">
        «Иногда самый важный код — это не тот, что ты пишешь,
        <br />а тот, что ты чувствуешь»
      </div>
    </FullScene>
  );
}

/* ---------- Экран 2. Рабочий стол ---------- */

type Win = "folder" | "readme" | "bin" | "launch" | null;

export function Desktop() {
  const g = useGame();
  const [phase, setPhase] = useState<"zoom" | "os">("zoom");
  const [win, setWin] = useState<Win>(null);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setTimeout(() => setPhase("os"), 2300);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (win !== "launch") return;
    if (progress >= 100) {
      const id = window.setTimeout(() => g.next(), 400);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setProgress((p) => Math.min(100, p + 7 + Math.random() * 12)), 120);
    return () => window.clearTimeout(id);
  }, [win, progress, g]);

  if (phase === "zoom") {
    return (
      <FullScene className="zoom-scene" bg="/img/room.webp">
        <div className="zoom-hint" onClick={() => setPhase("os")}>
          …
        </div>
      </FullScene>
    );
  }

  const open = (w: Win) => {
    sfx.click();
    setWin(w);
  };

  return (
    <FullScene bg={WALLPAPER} className="os">
      <div className="os-icons">
        <button type="button" className="os-icon glowing" onClick={() => open("folder")}>
          <Pix name="folder" size={4} />
          <span>PROJECT_YOU</span>
        </button>
        <button type="button" className="os-icon" onClick={() => open("readme")}>
          <Pix name="note" size={5} />
          <span>readme.txt</span>
        </button>
        <button type="button" className="os-icon" onClick={() => open("bin")}>
          <Pix name="bin" size={5} />
          <span>Корзина</span>
        </button>
      </div>

      {win === "readme" && (
        <OsWindow title="readme.txt — Блокнот" onClose={() => setWin(null)}>
          <p className="os-text">Не туда :)
            <br />Подсказка: светится папка PROJECT_YOU.</p>
        </OsWindow>
      )}
      {win === "bin" && (
        <OsWindow title="Корзина" onClose={() => setWin(null)}>
          <p className="os-text">Корзина пуста.
            <br />Всё плохое уже удалено. Осталось только хорошее.</p>
        </OsWindow>
      )}
      {win === "folder" && (
        <OsWindow title="C:\Users\Artem\PROJECT_YOU" onClose={() => setWin(null)}>
          <div className="os-files">
            <button type="button" className="os-icon file glowing" onClick={() => open("launch")}>
              <span className="exe-icon">
                <Pix name="guideMark" size={3} />
              </span>
              <span>Project_YOU.exe</span>
            </button>
          </div>
          <div className="os-status">1 объект · 10.11 КБ</div>
        </OsWindow>
      )}
      {win === "launch" && (
        <OsWindow title="Project_YOU.exe">
          <p className="os-text">Запуск Project_YOU.exe…</p>
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        </OsWindow>
      )}

      <div className="taskbar">
        <span className="start">▣ Пуск</span>
        <span className="tray">
          {now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          <small>{now.toLocaleDateString("ru-RU")}</small>
        </span>
      </div>
    </FullScene>
  );
}

function OsWindow({ title, children, onClose }: { title: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="os-window">
      <div className="os-titlebar">
        <span>{title}</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        )}
      </div>
      <div className="os-body">{children}</div>
    </div>
  );
}

/* ---------- Экран 3. Project_YOU.exe ---------- */

const BOOT = `> PROJECT: YOU
> Привет!
> Тебе нужно решить несколько головоломок,
> чтобы открыть секретное послание.
>
> Так как ты программист,
> думаю, ты с ними справишься.
>
> Готов начать?`;

export function Terminal() {
  const g = useGame();
  const [done, setDone] = useState(false);
  return (
    <FullScene className="terminal-scene">
      <div className="crt">
        <div className="crt-bar">
          <span>Project_YOU.exe</span>
          <span>● ● ●</span>
        </div>
        <pre className="crt-text">
          <Typewriter text={BOOT} speed={32} onDone={() => setDone(true)} />
        </pre>
        <div className={`crt-actions ${done ? "show" : ""}`}>
          <Btn className="primary run" onClick={g.next} disabled={!done || g.transitioning}>
            RUN.exe
          </Btn>
        </div>
      </div>
    </FullScene>
  );
}
