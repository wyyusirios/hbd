"use client";

import { useState } from "react";
import { ITEMS } from "../data";
import { BOARD, CHAT_SPACE, HALL, PLAZA, SKY_DEEP } from "../pixel/backgrounds";
import { At, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { ChoiceGrid, Dialog, Hints, NextButton, OrderPuzzle, Panel, Success, Typewriter, type Line } from "../ui/kit";
import { Scene } from "../ui/Scene";

/* ---------- Уровень 8. Сервер Aruku ---------- */

const SIGNS = [
  { id: "discord", label: "Discord · Aruku", x: 20 },
  { id: "telegram", label: "Telegram", x: 96 },
  { id: "steam", label: "Steam", x: 172 },
  { id: "minecraft", label: "Minecraft", x: 248 },
];

export function Level8() {
  const g = useGame();
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <Scene
      bg={CHAT_SPACE}
      panelPos="bottom"
      art={
        <>
          {SIGNS.map((s) => (
            <At key={s.id} x={s.x} y={56} w={56} className={`neon-sign ${solved && s.id === "discord" ? "on" : ""} ${solved && s.id !== "discord" ? "off" : ""}`}>
              {s.label}
            </At>
          ))}
          {solved && (
            <At x={100} y={14} w={120} className="big-start">
              START
            </At>
          )}
        </>
      }
      panel={
        <Panel>
          <p className="lead">У каждой истории есть точка начала. Где началась ваша?</p>
          <ChoiceGrid
            cols={2}
            correct="discord"
            solved={solved}
            choices={SIGNS.map((s) => ({ id: s.id, label: s.label }))}
            onWrong={() =>
              setMsg(g.has("aruku") ? "Не здесь. Вспомни записку из лесного сундука: там было одно слово." : "Не здесь. Попробуй ещё.")
            }
            onCorrect={() => {
              setSolved(true);
              setMsg("");
              g.give("mapPiece");
            }}
          />
          {msg && <div className="soft-hint">{msg}</div>}
          {solved && (
            <Success>
              Discord-сервер Aruku. Здесь стоит отметка <b>START</b> — с неё всё и началось.
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 9. Потерянное сообщение ---------- */

export function Level9() {
  const g = useGame();
  const [solved, setSolved] = useState(false);
  const [memoryDone, setMemoryDone] = useState(false);

  return (
    <Scene
      bg={BOARD}
      panelPos="center"
      panel={
        <Panel title="Потерянное сообщение">
          <p className="lead">Слова на доске перепутались. Нажимай на карточки по порядку, чтобы восстановить сообщение.</p>
          <OrderPuzzle
            items={["встретились", "вы", "Aruku", "на"]}
            answer={["вы", "встретились", "на", "Aruku"]}
            result="Вы встретились на Aruku"
            onSolved={() => {
              setSolved(true);
              g.give("memory");
            }}
          />
          {solved && (
            <div className="memory">
              <div className="memory-title">◆ Воспоминание восстановлено</div>
              <p>
                <Typewriter text={ITEMS.memory.read ?? ""} speed={30} onDone={() => setMemoryDone(true)} />
              </p>
            </div>
          )}
          {memoryDone && (
            <Success>
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 10. Почтальон времени ---------- */

const POSTMAN = { who: "Почтальон", portrait: "postman" };

export function Level10() {
  const g = useGame();
  const [ready, setReady] = useState(false);
  const [solved, setSolved] = useState(false);
  const [say, setSay] = useState<Line | null>(null);

  const card = (day: string) => (
    <span className="cal">
      <span className="cal-top">ноября</span>
      <b>{day}</b>
    </span>
  );

  return (
    <Scene
      bg={PLAZA}
      panelPos="bottom"
      lift={60}
      art={
        <>
          <Sprite name="postman" x={112} y={152} scale={2} className="bob" />
          <Sprite name="mailbox" x={156} y={152} scale={2} />
          {solved && <Sprite name="seal" x={170} y={98} scale={3} anchor="center" className="glow-gold pop" />}
        </>
      }
      panel={
        <Panel>
          {!say ? (
            <Dialog
              lines={[
                { ...POSTMAN, text: "Почта для Артёма! Пришли три календарные карточки, но настоящая — только одна." },
                { ...POSTMAN, text: "Когда день рождения Артёма?" },
              ]}
              onDone={() => setReady(true)}
            />
          ) : (
            <Dialog key={say.text} lines={[say]} />
          )}
          {ready && (
            <ChoiceGrid
              cols={3}
              correct="10"
              solved={solved}
              choices={[
                { id: "10", label: card("10") },
                { id: "11", label: card("11") },
                { id: "12", label: card("12") },
              ]}
              onWrong={(id) => setSay({ ...POSTMAN, text: `${id} ноября? Хм, на этой карточке штамп не тот. Проверь ещё раз.` })}
              onCorrect={() => {
                setSolved(true);
                sfx.magic();
                g.give("seal");
                setSay({ ...POSTMAN, text: "10 ноября! Карточка вспыхнула золотом — значит, настоящая. Распишитесь в получении… шучу, она ваша." });
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

/* ---------- Уровень 11. Почти три года ---------- */

const TIMELINE = ["envelope", "heart", "star", "note", "heart", "star", "candleGold"];

export function Level11() {
  const g = useGame();
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <Scene
      bg={SKY_DEEP}
      panelPos="bottom"
      art={
        <>
          <At x={24} y={96} w={272} className="timeline" />
          {TIMELINE.map((s, i) => (
            <Sprite
              key={i}
              name={s}
              x={40 + i * 40}
              y={96}
              scale={2}
              anchor="center"
              className={`tl-dot ${solved ? "lit" : ""}`}
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
          {solved && <Sprite name="hourglass" x={160} y={60} scale={3} anchor="center" className="glow-gold pop" />}
        </>
      }
      panel={
        <Panel>
          <p className="lead">Сколько времени прошло с тех пор, как началась ваша история?</p>
          <ChoiceGrid
            cols={3}
            correct="three"
            solved={solved}
            choices={[
              { id: "weeks", label: "Несколько недель" },
              { id: "three", label: "Почти три года" },
              { id: "ten", label: "Десять лет" },
            ]}
            onWrong={(id) => setMsg(id === "weeks" ? "Кажется, гораздо дольше." : "Пока ещё нет. Но всё впереди.")}
            onCorrect={() => {
              setSolved(true);
              setMsg("");
              g.give("hourglass");
            }}
          />
          {msg && !solved && <div className="soft-hint">{msg}</div>}
          {solved && (
            <Success>
              <Typewriter text="Целая маленькая вселенная разговоров, шуток и моментов, которые не помещаются в календарь." caret={false} />
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 12. Четыре этапа ---------- */

export function Level12() {
  const g = useGame();
  const [solved, setSolved] = useState(false);

  return (
    <Scene
      bg={HALL}
      panelPos="bottom"
      lift={40}
      art={
        <>
          {solved && <At x={140} y={40} w={40} h={100} className="door-light" />}
          {solved && <Sprite name="silverKey" x={160} y={62} scale={3} anchor="center" className="glow-silver pop" />}
        </>
      }
      panel={
        <Panel title="Зал четырёх карточек">
          <p className="lead">Расположи этапы истории в правильном порядке.</p>
          <OrderPuzzle
            items={["Дом", "Знакомство", "Воспоминания", "Разговоры"]}
            answer={["Знакомство", "Разговоры", "Воспоминания", "Дом"]}
            joiner=" → "
            onSolved={() => {
              setSolved(true);
              sfx.door();
              g.give("silverKey");
            }}
          />
          {!solved && <Hints list={["С чего начинается любая история?", "Воспоминания появляются после долгих разговоров.", "Дом — это то, к чему всё приходит."]} />}
          {solved && (
            <Success>
              Дверь в конце зала приоткрылась, а в замке остался <b>серебряный ключ</b>.
              <NextButton label="К тайной комнате" />
            </Success>
          )}
        </Panel>
      }
    />
  );
}
