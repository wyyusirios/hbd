"use client";

import { useState } from "react";
import { FOREST_CHEST, FOREST_CLEARING, FOREST_FORK, SKY_NIGHT } from "../pixel/backgrounds";
import { At, Hotspot, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { AnswerForm, Btn, ChoiceGrid, Dialog, ItemPicker, NextButton, Panel, Success, normalize, type Line } from "../ui/kit";
import { Scene } from "../ui/Scene";

const SWALLOW = { who: "Ласточка", portrait: "swallowPerch" };
const BUBA = { who: "Буба", portrait: "buba" };
const CHOMIK = { who: "Чомик", portrait: "chomik" };

/* ---------- Уровень 4. Проводник ---------- */

const STARS = [
  { x: 46, y: 50, text: "Эта звезда — для первого шага. Ты его уже сделал." },
  { x: 124, y: 26, text: "Эта — для вопросов. Не бойся ошибаться: здесь ничего не ломается навсегда." },
  { x: 214, y: 44, text: "А эта будет гореть, пока ты идёшь. Смотри — тропа в лес открылась." },
];

export function Level4() {
  const g = useGame();
  const [intro, setIntro] = useState(false);
  const [lit, setLit] = useState<number[]>([]);
  const done = lit.length === STARS.length;
  const lastText = lit.length ? STARS[lit[lit.length - 1]].text : null;

  return (
    <Scene
      bg={SKY_NIGHT}
      panelPos="bottom"
      art={
        <>
          <Sprite frames={["swallowA", "swallowB"]} fps={3} x={160} y={118} scale={2} className="hover glow-soft" />
          {STARS.map((s, i) => (
            <Sprite
              key={i}
              name="star"
              x={s.x}
              y={s.y}
              scale={3}
              anchor="center"
              className={`star-btn ${lit.includes(i) ? "lit" : ""} ${intro ? "" : "idle"}`}
              label={`Звезда ${i + 1}`}
              disabled={!intro || lit.includes(i)}
              onClick={() => {
                sfx.magic();
                setLit((l) => {
                  const nextLit = [...l, i];
                  if (nextLit.length === STARS.length) g.give("guide");
                  return nextLit;
                });
              }}
            />
          ))}
          {done && <At x={236} y={92} w={70} className="forest-path">тропа в лес ▸</At>}
        </>
      }
      panel={
        <Panel>
          {!lastText ? (
            <Dialog
              lines={[
                { ...SWALLOW, text: "Привет, я — Ласточка. Твой проводник в этом приключении." },
                {
                  ...SWALLOW,
                  text: "Я не буду решать загадки за тебя. Но если ты внимательно посмотришь вокруг, я помогу заметить то, что другие могли бы пропустить.",
                },
                { ...SWALLOW, text: "Для начала — зажги три звезды. Нажми на них." },
              ]}
              onDone={() => setIntro(true)}
            />
          ) : (
            <Dialog key={lastText} lines={[{ ...SWALLOW, text: lastText }]} />
          )}
          {intro && !done && <div className="counter">Звёзды: {lit.length} / 3</div>}
          {done && (
            <Success>
              Теперь у тебя есть <b>знак проводника</b>: там, где он светится, можно попросить подсказку.
              <NextButton label="В лес" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 5. Буба и запертый сундук ---------- */

const BUBA_WRONG = [
  "Я тоже на это надеялся. Но замку всё равно.",
  "Я тоже на это надеялся. Но замку всё равно. Даже обидно.",
  "Я тоже на это надеялся. Но замку всё равно. Вредный замок.",
];

export function Level5() {
  const g = useGame();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [say, setSay] = useState<Line | null>(null);
  const [wrongs, setWrongs] = useState(0);

  return (
    <Scene
      bg={FOREST_CHEST}
      panelPos="bottom"
      lift={62}
      art={
        <>
          <Sprite name={open ? "chestOpen" : "chestClosed"} x={204} y={150} scale={2} className={open ? "glow-gold" : ""} />
          <Sprite name={open ? "bubaHappy" : "buba"} x={156} y={152} scale={2} className={open ? "hop" : "bob"} />
        </>
      }
      panel={
        <Panel>
          {!say ? (
            <Dialog
              lines={[
                {
                  ...BUBA,
                  text: "Привет! Я Буба. Я нашёл сундук, но он закрыт. Я пробовал его уговорить, покормить и обидеться на него. Ничего не помогло.",
                },
                { ...BUBA, text: "Что поможет открыть сундук?" },
              ]}
              onDone={() => setReady(true)}
            />
          ) : (
            <Dialog key={`${say.text}-${wrongs}`} lines={[say]} />
          )}
          {ready && (
            <ChoiceGrid
              cols={4}
              solved={open}
              correct="key"
              choices={[
                { id: "key", label: "Ключ", icon: "key" },
                { id: "apple", label: "Яблоко", icon: "apple" },
                { id: "feather", label: "Перо", icon: "feather" },
                { id: "coin", label: "Монета", icon: "coin" },
              ]}
              onWrong={() => {
                setSay({ ...BUBA, text: BUBA_WRONG[wrongs % BUBA_WRONG.length] });
                setWrongs((n) => n + 1);
              }}
              onCorrect={() => {
                setOpen(true);
                sfx.door();
                g.give("chestKey", "forestMap");
                setSay({ ...BUBA, text: "Щёлк! Открылся! Внутри карта леса. А ключ оставь себе — у меня от него лапки чешутся." });
              }}
            />
          )}
          {open && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 6. Чомик знает дорогу ---------- */

export function Level6() {
  const g = useGame();
  const [ready, setReady] = useState(false);
  const [solved, setSolved] = useState(false);

  return (
    <Scene
      bg={FOREST_FORK}
      panelPos="bottom"
      lift={66}
      art={
        <>
          <Sprite name="rock" x={112} y={156} scale={3} />
          <Sprite name="chomik" x={112} y={136} scale={2} className={solved ? "hop" : "bob"} />
          {solved && <At x={270} y={128} w={46} h={24} className="secret-path" />}
          {solved && <At x={252} y={110} w={64} className="path-label">тайная тропа</At>}
        </>
      }
      panel={
        <Panel>
          {!solved ? (
            <Dialog
              lines={[{ ...CHOMIK, text: "Я Чомик! Я знаю короткий путь. Но сначала докажи, что умеешь замечать закономерности." }]}
              onDone={() => setReady(true)}
            />
          ) : (
            <Dialog lines={[{ ...CHOMIK, text: "Тридцать два! Видишь — за деревом тропа. Её никто не замечает, кроме нас." }]} />
          )}
          {ready && (
            <>
              <div className="sequence">2, 4, 8, 16, <span className={solved ? "good-text" : ""}>{solved ? "32" : "__"}</span></div>
              <AnswerForm
                placeholder="Следующее число"
                inputMode="numeric"
                accept={(v) => normalize(v) === "32"}
                solved={solved}
                onCorrect={() => {
                  setSolved(true);
                  g.give("pathMap");
                }}
                wrong={(_, n) => (n > 1 ? "Каждое число в два раза больше предыдущего." : "Не то. Посмотри, как меняется каждое число.")}
              />
            </>
          )}
          {solved && (
            <Success>
              <NextButton label="По тайной тропе" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 7. Клад в лесу ---------- */

type CacheState = "hidden" | "glint" | "found" | "open";

export function Level7() {
  const g = useGame();
  const [say, setSay] = useState<Line>({ text: "Тайная тропа привела на поляну. Осмотрись: здесь что-то спрятано." });
  const [cache, setCache] = useState<CacheState>("hidden");
  const [picker, setPicker] = useState(false);
  const [coin, setCoin] = useState(g.has("coin"));

  const tell = (line: Line) => {
    sfx.click();
    setSay(line);
  };

  return (
    <Scene
      bg={FOREST_CLEARING}
      panelPos="bottom"
      lift={46}
      art={
        <>
          <Sprite
            name="mushroom"
            x={70}
            y={154}
            scale={3}
            className="glow-blue"
            label="Светящийся гриб"
            onClick={() => tell({ ...BUBA, text: "Это гриб. Он светится. Не ешь его — я однажды пробовал. Шучу. Наверное." })}
          />
          <Sprite name="mushroom" x={84} y={156} scale={2} className="glow-blue" />
          <Hotspot
            x={132}
            y={70}
            w={56}
            h={72}
            label="Старое дерево"
            onClick={() => {
              tell({ text: "Кора старого дерева тёплая. На ней вырезано: «Самое ценное иногда находится не там, куда ты смотришь, а чуть в стороне»." });
              if (cache === "hidden") setCache("glint");
            }}
          />
          <Sprite
            name="rock"
            x={256}
            y={160}
            scale={3}
            label="Камень"
            onClick={() => tell({ text: "Камень как камень. Хотя… нет, просто камень." })}
          />
          {!coin && (
            <Hotspot
              x={164}
              y={124}
              w={9}
              h={12}
              label="Что-то за деревом"
              className="coin-spot"
              onClick={() => {
                setCoin(true);
                g.give("coin");
                sfx.magic();
                setSay({ ...BUBA, text: "Эй! За деревом монета! Секретная! …Ладно, она твоя. Наверное, она счастливая." });
              }}
            >
              <span className="twinkle" />
            </Hotspot>
          )}
          {cache === "glint" && (
            <Sprite
              name="sparkle"
              x={204}
              y={150}
              scale={2}
              className="pulse"
              label="Что-то блестит"
              onClick={() => {
                setCache("found");
                tell({ text: "Под листьями чуть в стороне от дерева — маленький сундук. Он заперт на старый замок." });
              }}
            />
          )}
          {(cache === "found" || cache === "open") && (
            <Sprite
              name={cache === "open" ? "chestOpen" : "chestClosed"}
              x={206}
              y={152}
              scale={2}
              className={cache === "open" ? "glow-gold" : "pop"}
              label="Маленький сундук"
              onClick={cache === "found" ? () => setPicker(true) : undefined}
            />
          )}
          <Sprite name="buba" x={112} y={164} scale={2} className={cache === "open" ? "hop" : "bob"} />
          {cache === "open" && <At x={196} y={104} className="shard-float">O</At>}
          {picker && (
            <ItemPicker
              title="Чем открыть сундук?"
              correct="chestKey"
              onClose={() => setPicker(false)}
              onSuccess={() => {
                setPicker(false);
                setCache("open");
                sfx.door();
                g.give("aruku", "shardO");
                setSay({ ...BUBA, text: "Ого! А я думал, там мой запас печенья. А там записка с надписью ARUKU. И светящаяся буква O!" });
              }}
            />
          )}
        </>
      }
      panel={
        <Panel>
          <Dialog key={say.text} lines={[say]} />
          {cache === "found" && (
            <Btn className="primary" onClick={() => setPicker(true)}>
              Открыть сундук
            </Btn>
          )}
          {cache === "open" && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}
