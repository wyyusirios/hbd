"use client";

import { useEffect, useMemo, useState } from "react";
import { ITEMS } from "../data";
import { CAKE_ROOM, DIGITAL } from "../pixel/backgrounds";
import { At, Sprite } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { AnswerForm, Btn, Hints, Modal, NextButton, Panel, Success, normalize } from "../ui/kit";
import { Scene } from "../ui/Scene";

const DATE = "10.11.2004";
const isDate = (v: string) => normalize(v) === normalize(DATE);

/* ---------- Уровень 1. Первый запуск — Java ---------- */

export function Level1() {
  const g = useGame();
  const [run, setRun] = useState<0 | 1 | 2 | 3>(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (run === 0 || run === 3) return;
    const id = window.setTimeout(() => setRun((r) => (r + 1) as 2 | 3), 700);
    return () => window.clearTimeout(id);
  }, [run]);

  useEffect(() => {
    if (run === 3) sfx.ok();
  }, [run]);

  return (
    <Scene
      bg="/img/room.webp"
      dim
      panelPos="center"
      panel={
        <Panel className="wide">
          <p className="lead">Твоя первая задача — запустить этот код. Посмотри, что он выдаст. Запомни ответ, он тебе пригодится.</p>
          <div className="editor">
            <div className="editor-bar">
              <span>ProjectYou.java</span>
              <Btn className="small run-code" onClick={() => setRun(1)} disabled={run > 0 && run < 3}>
                ▶ Запустить код
              </Btn>
            </div>
            <pre className="code">
              <span className="kw">public class</span> <span className="ty">ProjectYou</span> {"{\n"}
              {"    "}<span className="kw">public static void</span> <span className="fn">main</span>(<span className="ty">String</span>[] args) {"{\n"}
              {"        "}<span className="kw">int</span> day = <span className="num">5</span> * <span className="num">2</span>;{"\n"}
              {"        "}<span className="kw">int</span> month = <span className="num">22</span> / <span className="num">2</span>;{"\n"}
              {"        "}<span className="kw">int</span> year = <span className="num">2000</span> + <span className="num">2</span> * <span className="num">2</span>;{"\n\n"}
              {"        "}<span className="ty">System</span>.out.<span className="fn">printf</span>({"\n"}
              {"            "}<span className="str">&quot;%02d.%02d.%04d%n&quot;</span>,{"\n"}
              {"            "}day, month, year{"\n"}
              {"        "});{"\n"}
              {"    }\n}"}
            </pre>
            {run > 0 && (
              <pre className="console">
                {"$ javac ProjectYou.java\n"}
                {run >= 2 && "$ java ProjectYou\n"}
                {run >= 3 && <span className="out">{DATE}</span>}
                {run < 3 && <span className="caret blink">_</span>}
              </pre>
            )}
          </div>
          <AnswerForm
            placeholder="Что вывел код?"
            accept={isDate}
            solved={solved}
            onCorrect={() => {
              setSolved(true);
              g.give("password");
            }}
            wrong={(_, n) =>
              run < 3
                ? "Сначала запусти код кнопкой ▶ и посмотри на вывод."
                : n > 1
                  ? `Формат: ДД.ММ.ГГГГ. Перепиши то, что появилось в консоли.`
                  : "Посмотри внимательно на вывод в консоли."
            }
          />
          {solved && (
            <Success>
              Пароль <b>{DATE}</b> сохранён в карманах. Он понадобится совсем скоро.
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 2. Двоичный шифр ---------- */

const PHRASE = "Пусть все сбудется";

export function Level2() {
  const g = useGame();
  const [solved, setSolved] = useState(false);
  const [secret, setSecret] = useState(false);

  const groups = useMemo(() => {
    const enc = new TextEncoder();
    return Array.from(PHRASE).map((ch) => Array.from(enc.encode(ch)).map((b) => b.toString(2).padStart(8, "0")));
  }, []);

  return (
    <Scene
      bg={DIGITAL}
      panelPos="center"
      art={
        <>
          {secret && <SecretNote22 onClose={() => setSecret(false)} />}
          <button
            type="button"
            className="hotspot-22"
            title="22"
            aria-label="Число 22"
            onClick={() => {
              sfx.magic();
              g.give("note22");
              setSecret(true);
            }}
          >
            22
          </button>
        </>
      }
      panel={
        <Panel className="wide">
          <p className="lead">Кто-то оставил тебе послание. Компьютер видит только числа, но ты можешь найти за ними слова.</p>
          <div className="bytes" aria-label="Двоичная последовательность UTF-8">
            {groups.map((bytes, i) => (
              <span key={i} className={`byte-group ${bytes.length === 1 ? "space" : ""}`}>
                {bytes.map((b, j) => (
                  <span key={j}>{b}</span>
                ))}
              </span>
            ))}
          </div>
          <p className="muted small-text">Кодировка UTF-8. Каждая рамка — один символ: кириллица занимает 2 байта (110xxxxx 10xxxxxx), пробел — 1 байт.</p>
          <Hints list={["Это пожелание.", "В нём три слова.", "Первое слово начинается на букву П."]} />
          <AnswerForm
            placeholder="Расшифрованная фраза…"
            accept={(v) => normalize(v) === normalize(PHRASE)}
            solved={solved}
            onCorrect={() => {
              setSolved(true);
              g.give("fragment");
            }}
            wrong={(v) =>
              normalize(v).split(" ").length !== 3 ? "Посчитай рамки-пробелы: слов должно быть три." : "Почти. Сверь буквы по байтам ещё раз."
            }
          />
          {solved && (
            <Success>
              «{PHRASE}». И пусть правда сбудется — всё, что ты задумал.
              <NextButton />
            </Success>
          )}
          <p className="footnote">Число 22 способно превращать абстрактные идеи в реальные.</p>
        </Panel>
      }
    />
  );
}

/* ---------- Уровень 3. Дата релиза ---------- */

const CAKE_X = 104;
const CAKE_BOTTOM = 136;
const CAKE_SCALE = 3;
const WICKS = [4, 10, 21, 27];

export function Level3() {
  const g = useGame();
  const [lit, setLit] = useState(false);
  const left = CAKE_X - (32 * CAKE_SCALE) / 2;
  const top = CAKE_BOTTOM - 21 * CAKE_SCALE;

  return (
    <Scene
      bg={CAKE_ROOM}
      panelPos="right"
      art={
        <>
          <div className={`group ${lit ? "bounce" : ""}`}>
            <Sprite name="cake" x={CAKE_X} y={CAKE_BOTTOM} scale={CAKE_SCALE} />
            {lit &&
              WICKS.map((w, i) => (
                <Sprite
                  key={w}
                  frames={i % 2 ? ["flameA", "flameB"] : ["flameB", "flameA"]}
                  fps={5}
                  x={left + CAKE_SCALE * (w + 0.5)}
                  y={top + 1}
                  scale={CAKE_SCALE}
                  className="flame"
                />
              ))}
          </div>
          {lit && (
            <>
              <At x={CAKE_X - 70} y={146} w={140} className="release">
                Релиз состоялся!
              </At>
              <At x={CAKE_X - 9} y={36} className="shard-float">
                H
              </At>
            </>
          )}
        </>
      }
      panel={
        <Panel title={<>Дата релиза: <span className="mono">**.**.____</span></>}>
          <p>Ты уже видел эту дату. Вспомни, что показал твой код.</p>
          <AnswerForm
            placeholder="ДД.ММ.ГГГГ"
            accept={isDate}
            solved={lit}
            inputMode="decimal"
            maxLength={10}
            onCorrect={() => {
              setLit(true);
              sfx.magic();
              g.give("candle", "shardH");
            }}
            wrong={(_, n) =>
              n > 1 && g.has("password")
                ? `Загляни в карманы: там лежит «${ITEMS.password.name}».`
                : "Не та дата. Это вывод твоего первого кода."
            }
          />
          {lit && (
            <Success>
              Свечи загорелись! В глазури блеснула светящаяся буква <b>H</b> — она отправилась в карманы. Похоже, это часть чего-то большего.
              <NextButton />
            </Success>
          )}
        </Panel>
      }
    />
  );
}

export function SecretNote22({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="letter-modal">
      <div className="panel-title">Секрет: записка «22»</div>
      <p className="letter-text">{ITEMS.note22.read}</p>
      <Btn className="primary small" onClick={onClose}>
        Закрыть
      </Btn>
    </Modal>
  );
}
