"use client";

import { useEffect, useMemo, useState } from "react";
import { BOARD, CHAT_SPACE, FOREST_FORK } from "../pixel/backgrounds";
import { Hotspot, Pix, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { AnswerForm, Btn, Dialog, Hints, NextButton, OrderPuzzle, Panel, Success, Typewriter, normalize, type Line } from "../ui/kit";
import { Scene } from "../ui/Scene";

/* ---------- Поиск: пять символов Discord в комнате ---------- */

// Centres in stage pixels over /img/room.webp.
const SYMBOLS = [
  { x: 17, y: 63, label: "Книжная полка" },
  { x: 178, y: 44, label: "Фотография на гирлянде" },
  { x: 71, y: 120, label: "Кружка" },
  { x: 287, y: 24, label: "Звёзды за окном" },
  { x: 206, y: 113, label: "Подножие лампы" },
];

const DECOYS = [
  { x: 120, y: 58, w: 36, h: 36, text: "Этот слишком заметный — он не считается. Ищи спрятанные." },
  { x: 222, y: 84, w: 30, h: 38, text: "Кот смотрит на тебя и молчит. Подсказкой это не считается." },
];

export function Search() {
  const g = useGame();
  const [found, setFound] = useState<number[]>([]);
  const [say, setSay] = useState("Кажется, кто-то оставил для тебя сообщение… Найди все спрятанные символы Discord в этой комнате. Их 5.");
  const [hinted, setHinted] = useState<number | null>(null);
  const done = found.length === SYMBOLS.length;

  useEffect(() => {
    if (hinted === null) return;
    const id = window.setTimeout(() => setHinted(null), 2600);
    return () => window.clearTimeout(id);
  }, [hinted]);

  return (
    <Scene
      bg="/img/room.webp"
      panelPos="bottom"
      art={
        <>
          {DECOYS.map((d, i) => (
            <Hotspot key={i} x={d.x} y={d.y} w={d.w} h={d.h} label="Осмотреть" className="quiet" onClick={() => { sfx.click(); setSay(d.text); }} />
          ))}
          {SYMBOLS.map((s, i) => {
            const isFound = found.includes(i);
            return (
              <Hotspot
                key={i}
                x={s.x - 10}
                y={s.y - 9}
                w={20}
                h={18}
                label={s.label}
                className={`quiet discord-spot ${isFound ? "found" : ""} ${hinted === i ? "hinted" : ""}`}
                onClick={() => {
                  if (isFound) return;
                  sfx.magic();
                  const next = [...found, i];
                  setFound(next);
                  if (next.length === SYMBOLS.length) {
                    g.give("discord");
                    setSay("Все пять! Кто-то явно очень ждёт тебя в Discord.");
                  } else {
                    setSay(`Нашёлся! ${s.label}. Осталось ${SYMBOLS.length - next.length}.`);
                  }
                }}
              >
                <Pix name="discordIcon" size={2} />
              </Hotspot>
            );
          })}
        </>
      }
      panel={
        <Panel className="search-panel">
          <div className="search-row">
            <p className="lead">{say}</p>
            <div className="search-count">
              <b>
                {found.length}/{SYMBOLS.length}
              </b>
              <span>⌕</span>
            </div>
          </div>
          {!done ? (
            <Btn
              className="small ghost"
              onClick={() => {
                const left = SYMBOLS.findIndex((_, i) => !found.includes(i));
                setHinted(left);
              }}
            >
              Подсветить один символ
            </Btn>
          ) : (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Шифр Цезаря ---------- */

const PLAIN = "Follow the swallow";
const SHIFT = 3;

function caesar(text: string, shift: number) {
  return text.replace(/[a-z]/gi, (ch) => {
    const base = ch === ch.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

const CHOMIK = { who: "Чомик", portrait: "chomik" };

export function Caesar() {
  const g = useGame();
  const [ready, setReady] = useState(false);
  const [solved, setSolved] = useState(false);
  const cipher = useMemo(() => caesar(PLAIN, SHIFT), []);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const lines: Line[] = solved
    ? [{ ...CHOMIK, text: "Follow the swallow — иди за ласточкой! Я так и знал. Она всегда знает дорогу домой." }]
    : [
        { ...CHOMIK, text: "Стой! На тропе лежала записка. Но она зашифрована." },
        { ...CHOMIK, text: "Это шифр Цезаря, сдвиг на 3. Каждая буква сдвинута на три вперёд по алфавиту. Расшифруешь?" },
      ];

  return (
    <Scene
      bg={FOREST_FORK}
      panelPos="right"
      lift={14}
      art={
        <>
          <Sprite name="rock" x={84} y={156} scale={3} />
          <Sprite name="chomik" x={84} y={136} scale={2} className={solved ? "hop" : "bob"} />
          <Sprite name="note" x={112} y={150} scale={2} className={solved ? "glow-gold" : "pulse"} />
        </>
      }
      panel={
        <Panel title="Шифр Чомика">
          <Dialog key={solved ? "solved" : "intro"} lines={lines} onDone={() => setReady(true)} />
          {(ready || solved) && (
            <>
              <div className="cipher-box">{solved ? PLAIN : cipher}</div>
              <div className="alphabet" aria-label="Алфавит со сдвигом">
                <span>{alphabet}</span>
                <span className="shifted">{caesar(alphabet, SHIFT)}</span>
              </div>
              <AnswerForm
                placeholder="Расшифрованная фраза…"
                accept={(v) => normalize(v) === normalize(PLAIN)}
                solved={solved}
                onCorrect={() => {
                  setSolved(true);
                  g.give("caesarNote");
                }}
                wrong={(v) =>
                  normalize(v) === normalize(cipher)
                    ? "Это сама шифровка. Сдвинь каждую букву на 3 назад."
                    : "Не совсем. Сверь по строчкам алфавита: нижняя буква превращается в верхнюю."
                }
              />
              {!solved && <Hints list={["Каждую букву сдвинь на 3 назад: D → A, E → B, F → C.", "Первое слово — Follow.", "Это совет: за кем идти дальше?"]} />}
            </>
          )}
          {solved && (
            <Success>
              <NextButton label="За ласточкой" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Код: собрать фразу из фрагментов ---------- */

export function CodeLine() {
  const g = useGame();
  const [solved, setSolved] = useState(false);
  const [ran, setRan] = useState(false);

  return (
    <Scene
      bg={BOARD}
      panelPos="center"
      panel={
        <Panel title="Собери фразу из фрагментов кода">
          <p className="lead">Фрагменты рассыпались. Нажимай на них по порядку, чтобы получилась одна правильная строка на JavaScript.</p>
          <div className="code-order">
            <OrderPuzzle
              items={["you", "const", ";", "home", "="]}
              answer={["const", "home", "=", "you", ";"]}
              result="const home = you;"
              wrongText="Код не скомпилировался. Попробуй другой порядок."
              onSolved={() => {
                setSolved(true);
                g.give("codeLine");
              }}
            />
          </div>
          {!solved && <Hints list={["Объявление переменной начинается с const.", "Сначала имя переменной, потом =, потом значение.", "Точка с запятой — в самом конце."]} />}
          {solved && (
            <>
              {!ran ? (
                <Btn className="small" onClick={() => setRan(true)}>
                  ▶ console.log(home)
                </Btn>
              ) : (
                <pre className="console code-run">
                  {"> console.log(home)\n"}
                  <Typewriter text="you ♡" speed={90} />
                </pre>
              )}
              <Success>
                <NextButton label="К последней двери" />
              </Success>
            </>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Вопрос: кнопка «Нет» убегает ---------- */

const DODGE_LINES = [
  "Не-а, так не пойдёт.",
  "Кнопка «Нет» сегодня не работает.",
  "Не поймаешь!",
  "Ответ «нет» не принимается.",
  "Попробуй другую кнопку.",
  "Она очень быстрая. Сдавайся.",
];

export function Question() {
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [pos, setPos] = useState({ x: 62, y: 50 });

  // Jump to a random spot inside the button area, away from the current one and from «Да».
  const dodge = () => {
    sfx.blip();
    setDodges((n) => n + 1);
    setPos((p) => {
      for (let i = 0; i < 20; i++) {
        const x = 8 + Math.random() * 78;
        const y = 10 + Math.random() * 76;
        const farFromSelf = Math.abs(x - p.x) > 22 || Math.abs(y - p.y) > 30;
        const farFromYes = Math.abs(x - 22) > 20 || Math.abs(y - 50) > 30;
        if (farFromSelf && farFromYes) return { x, y };
      }
      return { x: p.x > 50 ? 30 : 75, y: p.y > 50 ? 20 : 80 };
    });
  };

  return (
    <Scene
      bg={CHAT_SPACE}
      panelPos="center"
      panel={
        <Panel title="Какой вопрос ты задавал мне постоянно?">
          <div className="chat-card">
            <div className="chat-avatar">
              <Pix name="swallowPerch" size={2} />
            </div>
            <div className="chat-body">
              <div className="chat-meta">
                <b>Ласточка</b> <span>— сегодня</span>
              </div>
              <p>
                <Typewriter text="Ты задавал вопрос «Сосала?»." caret={step === 0} onDone={() => setStep((s) => Math.max(s, 1))} />
              </p>
              {step >= 1 && (
                <p>
                  <Typewriter text="Теперь вопрос тебе: Сосал?" caret={step === 1} onDone={() => setStep((s) => Math.max(s, 2))} />
                </p>
              )}
            </div>
          </div>
          {step >= 2 && !answered && (
            <>
              <div className="dodge-area">
                <button
                  type="button"
                  className="btn primary dodge-yes"
                  onClick={() => {
                    sfx.ok();
                    setAnswered(true);
                  }}
                >
                  Да
                </button>
                <button
                  type="button"
                  className="btn dodge-no"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onPointerEnter={dodge}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    dodge();
                  }}
                  onFocus={dodge}
                  onClick={dodge}
                >
                  Нет
                </button>
              </div>
              {dodges > 0 && <div className="soft-hint">{DODGE_LINES[(dodges - 1) % DODGE_LINES.length]}</div>}
            </>
          )}
          {answered && (
            <Success>
              Я так и знала. ♡ Честный ответ засчитан.
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}
