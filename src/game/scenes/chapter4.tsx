"use client";

import { useEffect, useState } from "react";
import { ITEMS } from "../data";
import { HALL, LIBRARY, SKY_VIOLET, WINDOW_ROOM } from "../pixel/backgrounds";
import { At, Pix, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { Btn, ChoiceGrid, Dialog, ItemPicker, Modal, NextButton, Panel, Success, shakeEl, type Line } from "../ui/kit";
import { Scene } from "../ui/Scene";

const SWALLOW = { who: "Ласточка", portrait: "swallowPerch" };
const CHOMIK = { who: "Чомик", portrait: "chomik" };

/* ---------- Уровень 13. Кто такая Ласточка? ---------- */

export function Level13() {
  const g = useGame();
  const [phase, setPhase] = useState<"locked" | "opening" | "room">("locked");
  const [picker, setPicker] = useState(false);
  const [ready, setReady] = useState(false);
  const [solved, setSolved] = useState(false);
  const [say, setSay] = useState<Line | null>(null);

  useEffect(() => {
    if (phase !== "opening") return;
    const id = window.setTimeout(() => setPhase("room"), 1400);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (phase !== "room") {
    return (
      <Scene
        bg={HALL}
        panelPos="bottom"
        lift={40}
        art={
          <>
            {phase === "opening" ? <At x={140} y={40} w={40} h={100} className="door-light" /> : <At x={152} y={96} w={16} h={12} className="keyhole-glow" />}
            {picker && (
              <ItemPicker
                title="Какой ключ подойдёт к этой двери?"
                correct="silverKey"
                wrongText="Этот не подходит. Нужен ключ из зала четырёх карточек."
                onClose={() => setPicker(false)}
                onSuccess={() => {
                  setPicker(false);
                  sfx.door();
                  setPhase("opening");
                }}
              />
            )}
          </>
        }
        panel={
          <Panel>
            <p className="lead">За дверью в конце зала — тайная комната. Дверь заперта, но в замочной скважине мерцает серебристый свет.</p>
            <Btn className="primary" onClick={() => setPicker(true)} disabled={phase === "opening"}>
              Достать ключ из карманов
            </Btn>
          </Panel>
        }
      />
    );
  }

  return (
    <Scene
      bg={WINDOW_ROOM}
      panelPos="bottom"
      lift={30}
      art={
        <>
          <Sprite name="swallowPerch" x={170} y={127} scale={2} className={`glow-soft ${solved ? "hop" : "bob"}`} />
          {solved && <Sprite name="feather" x={130} y={70} scale={3} anchor="center" className="glow-soft pop float" />}
          {solved && <At x={196} y={56} className="shard-float">E</At>}
        </>
      }
      panel={
        <Panel>
          {!say ? (
            <Dialog
              lines={[
                { ...SWALLOW, text: "Ты нашёл тайную комнату. Я знала, что найдёшь." },
                { ...SWALLOW, text: "Я сопровождаю тебя в этой истории. Но есть одна вещь, которую я не могу решить вместо тебя." },
                { ...SWALLOW, text: "Какую роль я играю в этом приключении?" },
              ]}
              onDone={() => setReady(true)}
            />
          ) : (
            <Dialog key={say.text} lines={[say]} />
          )}
          {ready && (
            <ChoiceGrid
              cols={3}
              correct="guide"
              solved={solved}
              choices={[
                { id: "guide", label: "Проводник" },
                { id: "villain", label: "Главный злодей" },
                { id: "passer", label: "Случайный прохожий" },
              ]}
              onWrong={(id) =>
                setSay({
                  ...SWALLOW,
                  text: id === "villain" ? "Злодей? Я? Я даже на голубей не ругаюсь." : "Случайно в этой истории не бывает ничего. И никого.",
                })
              }
              onCorrect={() => {
                setSolved(true);
                sfx.magic();
                g.give("feather", "shardE");
                setSay({ ...SWALLOW, text: "Да. Я — проводник. Возьми моё перо. И ещё — букву E. Я берегла её до этой минуты." });
              }}
            />
          )}
          {solved && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 14. Словарь прозвищ ---------- */

const NICKS = [
  { id: "buba", name: "Буба", desc: "хомяк", sprite: "buba" },
  { id: "chomik", name: "Чомик", desc: "кролик", sprite: "chomik" },
  { id: "joy", name: "Радость", desc: "сердце", sprite: "heart" },
  { id: "robot", name: "Робот", desc: "механический", sprite: "robot" },
];
const RIGHT = ["buba", "chomik", "joy"];

export function Level14() {
  const g = useGame();
  const [sel, setSel] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState("");

  const check = (el: HTMLElement | null) => {
    const ok = sel.length === RIGHT.length && RIGHT.every((r) => sel.includes(r));
    if (ok) {
      sfx.ok();
      setSolved(true);
      setMsg("");
      g.give("symbols");
      return;
    }
    sfx.wrong();
    shakeEl(el);
    if (sel.includes("robot")) setMsg("Робот милый, но он здесь просто в гостях.");
    else if (sel.length < RIGHT.length) setMsg("Не хватает ещё прозвищ. Их три.");
    else setMsg("Что-то лишнее. Попробуй ещё.");
  };

  return (
    <Scene
      bg={SKY_VIOLET}
      panelPos="center"
      panel={
        <Panel title="Словарь прозвищ">
          <p className="lead">Найди прозвища, связанные с этой историей.</p>
          <div className="nick-grid" id="nick-grid">
            {NICKS.map((n) => {
              const on = sel.includes(n.id);
              const glowing = solved && RIGHT.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`nick ${on ? "on" : ""} ${glowing ? "glowing" : ""} ${solved && !glowing ? "faded" : ""}`}
                  disabled={solved}
                  onClick={() => {
                    sfx.click();
                    setMsg("");
                    setSel((s) => (s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id]));
                  }}
                >
                  <Pix name={n.sprite} size={4} />
                  <b>{n.name}</b>
                  <small>{n.desc}</small>
                </button>
              );
            })}
          </div>
          {!solved && (
            <Btn className="primary" onClick={() => check(document.getElementById("nick-grid"))} disabled={sel.length === 0}>
              Проверить
            </Btn>
          )}
          {msg && <div className="soft-hint">{msg}</div>}
          {solved && (
            <Success>
              Буба, Чомик и Радость превратились в светящиеся символы. Ты знаешь, кто их так называет. ♡
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 15. Тайная библиотека ---------- */

const BOOKS = [
  { id: "heart", symbol: "♥", x: 38, y: 52, color: "#c2416e", text: "Тёплые слова могут быть маленькими." },
  { id: "star", symbol: "★", x: 168, y: 86, color: "#3d55b8", text: "Некоторые моменты запоминаются без фотографий." },
  { id: "home", symbol: "⌂", x: 262, y: 120, color: "#3f7a58", text: "Иногда достаточно знать, что тебя ждут." },
];

const DECOYS = [
  { x: 80, y: 86, color: "#6a4a2a", text: "«Java. Полное руководство», том 22. Тяжёлый, как понедельник." },
  { x: 140, y: 120, color: "#4a3a8a", text: "«Как приручить хомяка». На полях кто-то написал: «невозможно»." },
  { x: 236, y: 52, color: "#7a3a4a", text: "Пустая обложка. Наверное, эту книгу ещё только предстоит написать." },
];

export function Level15() {
  const g = useGame();
  const [found, setFound] = useState<string[]>([]);
  const [say, setSay] = useState<Line>({
    ...CHOMIK,
    text: "Тут пахнет тайнами… и пылью. Ищи книги с символами: сердце, звезда и дом. Я покараулю.",
  });
  const [stage, setStage] = useState<"search" | "cache" | "read" | "done">("search");

  const open = (b: (typeof BOOKS)[number]) => {
    if (found.includes(b.id)) return;
    sfx.magic();
    const nextFound = [...found, b.id];
    setFound(nextFound);
    setSay({ who: `Книга ${b.symbol}`, text: b.text });
    if (nextFound.length === BOOKS.length) {
      window.setTimeout(() => {
        sfx.door();
        setStage("cache");
        setSay({ ...CHOMIK, text: "Слышал щелчок? Средний шкаф отъехал! За ним тайник!" });
      }, 1400);
    }
  };

  return (
    <Scene
      bg={LIBRARY}
      panelPos="bottom"
      lift={36}
      art={
        <>
          {DECOYS.map((d, i) => (
            <button
              key={i}
              type="button"
              className="book decoy"
              style={bookStyle(d.x, d.y, d.color)}
              aria-label="Книга"
              onClick={() => {
                sfx.click();
                setSay({ text: d.text });
              }}
            />
          ))}
          {BOOKS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`book special ${found.includes(b.id) ? "found" : ""}`}
              style={bookStyle(b.x, b.y, b.color)}
              aria-label={`Книга с символом ${b.symbol}`}
              onClick={() => open(b)}
            >
              <span>{b.symbol}</span>
            </button>
          ))}
          <div className={`shelf-slide ${stage !== "search" ? "moved" : ""}`} />
          {stage === "cache" && (
            <Sprite
              name="envelope"
              x={160}
              y={96}
              scale={3}
              anchor="center"
              className="glow-gold pulse"
              label="Письмо в тайнике"
              onClick={() => {
                sfx.item();
                setStage("read");
              }}
            />
          )}
          {stage === "done" && <At x={150} y={70} className="shard-float">M</At>}
          {stage === "read" && (
            <Modal className="letter-modal">
              <div className="panel-title">Письмо из тайника</div>
              <p className="letter-text">{ITEMS.letter.read}</p>
              <Btn
                className="primary small"
                onClick={() => {
                  setStage("done");
                  g.give("letter", "shardM");
                  setSay({ ...CHOMIK, text: "А в конверте ещё что-то светится… Буква M! Забирай." });
                }}
              >
                Сохранить письмо
              </Btn>
            </Modal>
          )}
        </>
      }
      panel={
        <Panel>
          <Dialog key={say.text} lines={[say]} />
          {stage === "search" && <div className="counter">Найдено книг: {found.length} / 3</div>}
          {stage === "done" && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

function bookStyle(x: number, y: number, color: string) {
  return {
    left: `${(x / 320) * 100}%`,
    top: `${(y / 180) * 100}%`,
    width: `${(9 / 320) * 100}%`,
    height: `${(24 / 180) * 100}%`,
    background: color,
  };
}

/* ---------- Уровень 16. Пять лучших качеств ---------- */

const STAR_POS = [
  { x: 46, y: 40 },
  { x: 100, y: 22 },
  { x: 160, y: 46 },
  { x: 220, y: 22 },
  { x: 274, y: 40 },
];

export function Level16() {
  const g = useGame();
  const [values, setValues] = useState<string[]>(() => [0, 1, 2, 3, 4].map((i) => g.qualities[i] ?? ""));
  const [lit, setLit] = useState(0);
  const [started, setStarted] = useState(false);
  const all = values.every((v) => v.trim().length > 0);
  const finished = started && lit >= 5;

  useEffect(() => {
    if (!started || lit >= 5) return;
    const id = window.setTimeout(() => {
      sfx.blip();
      setLit((n) => n + 1);
    }, 650);
    return () => window.clearTimeout(id);
  }, [started, lit]);

  const { give } = g;
  useEffect(() => {
    if (!finished) return;
    sfx.magic();
    give("stars");
  }, [finished, give]);

  return (
    <Scene
      bg={SKY_VIOLET}
      panelPos="bottom"
      art={
        <>
          {STAR_POS.map((p, i) => (
            <Sprite key={i} name="star" x={p.x} y={p.y} scale={3} anchor="center" className={`q-star ${i < lit ? "lit" : ""}`}>
              {i < lit && <span className="q-label">{values[i]}</span>}
            </Sprite>
          ))}
          {finished && (
            <At x={60} y={78} w={200} className="love-line">
              Вот за это я тебя и люблю.
            </At>
          )}
        </>
      }
      panel={
        <Panel>
          <p className="lead">Перед тем как продолжить путь, остановись на минуту. Напиши пять своих лучших качеств — тех, за которые ты себя ценишь.</p>
          <form
            className="qualities"
            onSubmit={(e) => {
              e.preventDefault();
              if (!all || started) return;
              const clean = values.map((v) => v.trim());
              setValues(clean);
              g.setQualities(clean);
              setStarted(true);
            }}
          >
            {values.map((v, i) => (
              <input
                key={i}
                className="input"
                value={v}
                placeholder={`${i + 1}.`}
                maxLength={40}
                disabled={started}
                onChange={(e) => setValues((vs) => vs.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
            {!started && (
              <button type="submit" className="btn primary" disabled={!all}>
                Зажечь звёзды
              </button>
            )}
          </form>
          {finished && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}
