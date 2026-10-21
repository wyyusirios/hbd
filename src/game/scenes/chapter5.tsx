"use client";

import { useCallback, useEffect, useState } from "react";
import { DOOR_WALL, GARDEN } from "../pixel/backgrounds";
import { At, Pix, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { Btn, Dialog, Modal, NextButton, Panel, Success, Typewriter, shakeEl, type Line } from "../ui/kit";
import { FullScene, Scene } from "../ui/Scene";

const SWALLOW = { who: "Ласточка", portrait: "swallowPerch" };

/* ---------- Уровень 17. Последний пароль ---------- */

const WORD = "HOME";
const TILES = ["E", "M", "O", "H"];
const DOOR_HINTS = [
  "Это английское слово из четырёх букв. Его ищет каждый путешественник в конце пути.",
  "Вспомни, о чём вся эта история: Aruku, разговоры, воспоминания… И куда они ведут.",
  "Первую букву ты нашёл на торте. Слово начинается с H.",
  "H, потом O… Ты почти у цели.",
];

export function Level17() {
  const [slots, setSlots] = useState<string[]>([]);
  const [wrongs, setWrongs] = useState(0);
  const [say, setSay] = useState<Line>({ ...SWALLOW, text: "Ты уже собрал всё необходимое. Вспомни, что ты искал с самого начала." });
  const [open, setOpen] = useState(false);

  const check = useCallback(
    (filled: string[]) => {
      if (filled.join("") === WORD) {
        sfx.door();
        window.setTimeout(() => sfx.magic(), 700);
        setOpen(true);
        setSay({ ...SWALLOW, text: "HOME. Ты нашёл его. Дверь открывается…" });
      } else {
        sfx.wrong();
        shakeEl(document.querySelector(".door-slots"));
        setSay({ ...SWALLOW, text: DOOR_HINTS[Math.min(wrongs, DOOR_HINTS.length - 1)] });
        setWrongs((n) => n + 1);
        window.setTimeout(() => setSlots([]), 500);
      }
    },
    [wrongs],
  );

  const press = useCallback(
    (letter: string) => {
      if (open || slots.length >= 4) return;
      const next = [...slots, letter];
      sfx.click();
      setSlots(next);
      if (next.length === 4) window.setTimeout(() => check(next), 250);
    },
    [open, slots, check],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toUpperCase();
      if (TILES.includes(k)) press(k);
      if (e.key === "Backspace") setSlots((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <Scene
      bg={DOOR_WALL}
      panelPos="bottom"
      lift={30}
      art={
        <>
          <div className={`big-door ${open ? "open" : ""}`}>
            <div className="door-glow" />
            <div className="leaf left" />
            <div className="leaf right" />
            <div className="door-cells">
              {[0, 1, 2, 3].map((i) => (
                <span key={i}>{slots[i] ?? ""}</span>
              ))}
            </div>
          </div>
          <Sprite name="swallowPerch" x={226} y={76} scale={1.5} className="glow-soft bob" />
          {open && (
            <At x={60} y={44} w={200} className="home-found">
              HOME FOUND
            </At>
          )}
        </>
      }
      panel={
        <Panel>
          <Dialog key={say.text} lines={[say]} />
          {!open && (
            <>
              <div className="door-slots">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`slot ${slots[i] ? "filled" : ""}`}>
                    {slots[i] ?? "_"}
                  </span>
                ))}
              </div>
              <div className="shard-tiles">
                {TILES.map((t) => (
                  <button key={t} type="button" className="shard-tile" onClick={() => press(t)}>
                    {t}
                  </button>
                ))}
                <button type="button" className="shard-tile erase" onClick={() => setSlots((s) => s.slice(0, -1))} aria-label="Стереть">
                  ⌫
                </button>
              </div>
              <p className="muted small-text">Светящиеся буквы из твоих карманов. Нажимай по порядку.</p>
            </>
          )}
          {open && (
            <Success>
              <NextButton label="Войти" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- HOME FOUND ---------- */

const HOME_TEXT = `Почти три года назад мы встретились на Aruku. Тогда ты ещё не знал, что однажды у тебя появится своя Ласточка.

Ты — мой Буба. Мой Чомик. Моя Радость.

И знаешь, Артём? Мне кажется, самое прекрасное в слове «дом» — это не стены и не адрес. Это чувство, когда рядом есть кто-то, с кем тебе хорошо.`;

const CHECKS = ["3 года", "Aruku", "Ласточка", "Буба", "Чомик", "Радость", "Ты ♡"];

export function HomeFound() {
  const g = useGame();
  const [typed, setTyped] = useState(false);
  const [checked, setChecked] = useState(0);

  useEffect(() => {
    if (!typed || checked >= CHECKS.length) return;
    const id = window.setTimeout(() => {
      sfx.blip();
      setChecked((n) => n + 1);
    }, 380);
    return () => window.clearTimeout(id);
  }, [typed, checked]);

  return (
    <FullScene className="terminal-scene home-scene">
      <div className="crt home-crt">
        <div className="crt-bar">
          <span>SYSTEM MESSAGE</span>
          <span>● ● ●</span>
        </div>
        <div className="home-title">
          <span className="house">⌂</span> HOME FOUND.
        </div>
        <div className="home-grid">
          <p className="home-text">
            <Typewriter text={HOME_TEXT} speed={24} onDone={() => setTyped(true)} />
          </p>
          <ul className="checklist">
            {CHECKS.map((c, i) => (
              <li key={c} className={i < checked ? "on" : ""}>
                <span>{i < checked ? "✓" : "·"}</span> {c}
              </li>
            ))}
          </ul>
        </div>
        {checked >= CHECKS.length && (
          <>
            <div className="exit-line">&gt; exit(0); // quest completed, love remains</div>
            <div className="crt-actions show">
              <Btn className="primary" onClick={g.next} disabled={g.transitioning}>
                Выйти на свет ▸
              </Btn>
            </div>
          </>
        )}
      </div>
    </FullScene>
  );
}

/* ---------- Уровень 18. Дом — это мы ---------- */

export const FINAL_LETTER = `С днём рождения, Артём!
Если ты читаешь это, значит, ты прошёл весь квест и добрался до самого главного.

Я хочу пожелать тебе побольше счастливых моментов, исполнения желаний, успехов во всём, за что ты берёшься, и сил справляться с любыми трудностями. Пусть рядом всегда будут люди, с которыми ты сможешь быть собой, смеяться над всякой ерундой и чувствовать себя по-настоящему счастливым.

Спасибо тебе за наше знакомство, за воспоминания, за разговоры и просто за то, что ты есть. Мне очень хочется, чтобы впереди у нас было ещё много историй, которые однажды мы сможем вспомнить с улыбкой.

И пусть этот маленький проект напомнит тебе об одной простой вещи: ты очень дорог мне.
Квест пройден, но наша история продолжается…

С днём рождения, моя Радость.

От Насти, с теплом и любовью.`;

export function Finale() {
  const g = useGame();
  const [step, setStep] = useState(0);
  const [letter, setLetter] = useState(false);

  useEffect(() => {
    // 0: scene fades in · 1: swallow flies · 2: swallow becomes a star · 3: letter
    const timers = [
      window.setTimeout(() => setStep(1), 1200),
      window.setTimeout(() => {
        setStep(2);
        sfx.magic();
      }, 5600),
      window.setTimeout(() => {
        setStep(3);
        setLetter(true);
      }, 7400),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <Scene
      bg={GARDEN}
      panelPos="bottom"
      className="finale"
      art={
        <>
          <div className="finale-cast">
            <Sprite name="schnauzerSide" x={104} y={153} scale={2} className="bob" />
            <Sprite name="artemTall" x={144} y={153} scale={2} className={step >= 3 ? "hop" : ""} />
            <Sprite name="nastyaTall" x={178} y={153} scale={2} className={step >= 3 ? "hop delay" : ""} />
            <Sprite name="retrieverSide" x={220} y={153} scale={2} className="bob delay" />
            <At x={157} y={64} className="couple-heart">♥</At>
          </div>
          {step === 1 && (
            <div className="swallow-flight">
              <Pix frames={["swallowA", "swallowB"]} name="swallowA" fps={5} size={3} />
            </div>
          )}
          {step >= 2 && <Sprite name="star" x={160} y={30} scale={3} anchor="center" className="final-star" />}
          {letter && (
            <Modal onClose={() => setLetter(false)} className="letter-modal final-letter">
              <div className="letter-paper">
                <p className="letter-text">{FINAL_LETTER}</p>
              </div>
              <div className="row center">
                <Btn
                  className="primary"
                  onClick={() => {
                    g.reset();
                    g.goTo("title");
                  }}
                >
                  Играть снова ♡
                </Btn>
                <Btn onClick={() => g.goTo("gallery")}>Посмотреть воспоминания</Btn>
              </div>
              <button type="button" className="link close-letter" onClick={() => setLetter(false)}>
                посмотреть на сад
              </button>
            </Modal>
          )}
        </>
      }
      panel={
        step >= 3 && !letter ? (
          <Panel className="finale-panel">
            <div className="row center">
              <Btn className="primary" onClick={() => setLetter(true)}>
                Письмо ♡
              </Btn>
              <Btn onClick={() => g.goTo("gallery")}>Посмотреть воспоминания</Btn>
              <Btn
                className="ghost"
                onClick={() => {
                  g.reset();
                  g.goTo("title");
                }}
              >
                Играть снова ♡
              </Btn>
            </div>
          </Panel>
        ) : undefined
      }
    />
  );
}
