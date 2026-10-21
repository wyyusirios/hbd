"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ITEMS, type ItemId } from "../data";
import { Pix } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";

/* ---------- helpers ---------- */

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,!?;:«»"'()\-—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Wobble an element without remounting it (keeps input focus). */
export function shakeEl(el: Element | null) {
  el?.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 360, easing: "steps(6)" },
  );
}

/** Re-trigger a CSS shake animation by toggling a key. */
export function useShake(): [number, () => void] {
  const [n, setN] = useState(0);
  return [n, () => setN((x) => x + 1)];
}

/* ---------- typewriter ---------- */

export function Typewriter({
  text,
  speed = 28,
  onDone,
  className = "",
  caret = true,
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
  caret?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (shown >= text.length) {
      doneRef.current?.();
      return;
    }
    const ch = text[shown];
    const delay = ch === "\n" ? speed * 6 : ch === "." || ch === "," ? speed * 4 : speed;
    const id = window.setTimeout(() => {
      setShown((n) => n + 1);
      if (shown % 3 === 0) sfx.blip();
    }, delay);
    return () => window.clearTimeout(id);
  }, [shown, text, speed]);

  const done = shown >= text.length;
  return (
    <span className={`typewriter ${className}`} onClick={() => setShown(text.length)}>
      {text.slice(0, shown)}
      {caret && <span className={`caret ${done ? "blink" : ""}`}>_</span>}
    </span>
  );
}

/* ---------- dialogue ---------- */

export interface Line {
  who?: string;
  portrait?: string;
  text: string;
}

/** Character dialogue box. Lines advance on click; `onDone` fires after the last line has typed out. */
export function Dialog({ lines, onDone, className = "" }: { lines: Line[]; onDone?: () => void; className?: string }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(false);
  const firedRef = useRef(false);
  const line = lines[Math.min(i, lines.length - 1)];
  const last = i >= lines.length - 1;

  useEffect(() => {
    if (last && typed && !firedRef.current) {
      firedRef.current = true;
      onDone?.();
    }
  }, [last, typed, onDone]);

  return (
    <div className={`dialog ${className}`}>
      {line.portrait && (
        <div className="portrait">
          <Pix name={line.portrait} size={3} />
        </div>
      )}
      <div className="dialog-body">
        {line.who && <div className="who">{line.who}:</div>}
        <p className="say">
          <Typewriter key={`${i}-${line.text}`} text={line.text} onDone={() => setTyped(true)} caret={!last || !typed} />
        </p>
        {!last && typed && (
          <button
            type="button"
            className="btn small ghost next-line"
            onClick={() => {
              sfx.click();
              setTyped(false);
              setI((n) => n + 1);
            }}
          >
            Дальше ▸
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- panels and buttons ---------- */

export function Panel({ children, className = "", title }: { children: ReactNode; className?: string; title?: ReactNode }) {
  return (
    <div className={`panel ${className}`}>
      {title && <div className="panel-title">{title}</div>}
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  className = "",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function NextButton({ label = "Дальше" }: { label?: string }) {
  const g = useGame();
  return (
    <Btn className="primary next-btn" onClick={g.next} disabled={g.transitioning}>
      {label} ▸
    </Btn>
  );
}

export function Success({ children }: { children: ReactNode }) {
  return <div className="success">{children}</div>;
}

/* ---------- answers ---------- */

export function AnswerForm({
  accept,
  onCorrect,
  wrong,
  placeholder = "Введи ответ…",
  button = "Проверить",
  inputMode,
  maxLength,
  solved,
}: {
  accept: (value: string) => boolean;
  onCorrect: (value: string) => void;
  wrong?: (value: string, attempt: number) => string;
  placeholder?: string;
  button?: string;
  inputMode?: "text" | "numeric" | "decimal";
  maxLength?: number;
  solved?: boolean;
}) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [bad, setBad] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (solved || !value.trim()) return;
    if (accept(value)) {
      sfx.ok();
      setMsg("");
      onCorrect(value);
    } else {
      sfx.wrong();
      setBad(true);
      shakeEl(inputRef.current);
      const n = attempt + 1;
      setAttempt(n);
      setMsg(wrong ? wrong(value, n) : "Не совсем. Попробуй ещё раз.");
    }
  };

  return (
    <form className="answer" onSubmit={submit}>
      <div className="answer-row">
        <input
          ref={inputRef}
          className={`input ${bad ? "bad" : ""} ${solved ? "good" : ""}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setBad(false);
          }}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={solved}
        />
        <button type="submit" className="btn primary" disabled={solved}>
          {button}
        </button>
      </div>
      {msg && !solved && <div className="soft-hint">{msg}</div>}
    </form>
  );
}

export interface Choice {
  id: string;
  label: ReactNode;
  icon?: string;
}

/** Single-choice buttons: wrong choices flash red and wobble, the right one turns gold. */
export function ChoiceGrid({
  choices,
  correct,
  onCorrect,
  onWrong,
  cols = 2,
  solved,
}: {
  choices: Choice[];
  correct: string;
  onCorrect: () => void;
  onWrong?: (id: string) => void;
  cols?: number;
  solved?: boolean;
}) {
  const [bad, setBad] = useState<{ id: string; n: number } | null>(null);
  return (
    <div className="choices" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {choices.map((c) => {
        const isBad = bad?.id === c.id;
        const isGood = solved && c.id === correct;
        return (
          <button
            key={isBad ? `${c.id}-${bad.n}` : c.id}
            type="button"
            className={`choice ${isBad ? "bad shake" : ""} ${isGood ? "good" : ""}`}
            disabled={solved}
            onClick={() => {
              if (c.id === correct) {
                sfx.ok();
                setBad(null);
                onCorrect();
              } else {
                sfx.wrong();
                setBad({ id: c.id, n: (bad?.n ?? 0) + 1 });
                onWrong?.(c.id);
              }
            }}
          >
            {c.icon && <Pix name={c.icon} size={5} />}
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Build a sequence by tapping cards in order. */
export function OrderPuzzle({
  items,
  answer,
  onSolved,
  joiner = " ",
  wrongText = "Порядок не тот. Попробуй иначе.",
  result,
}: {
  items: string[];
  answer: string[];
  onSolved: () => void;
  joiner?: string;
  wrongText?: string;
  result?: string;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "bad" | "good">("idle");
  const [shake, bump] = useShake();

  const pick = (idx: number) => {
    if (picked.length >= answer.length) return;
    sfx.click();
    const next = [...picked, idx];
    setPicked(next);
    if (next.length !== answer.length) {
      setState("idle");
      return;
    }
    if (next.every((p, i) => items[p] === answer[i])) {
      setState("good");
      sfx.ok();
      onSolved();
    } else {
      setState("bad");
      sfx.wrong();
      bump();
    }
  };

  return (
    <div className="order">
      <div key={shake} className={`order-slots ${state === "bad" ? "shake bad" : ""} ${state === "good" ? "good" : ""}`}>
        {answer.map((_, i) => {
          const idx = picked[i];
          return (
            <button
              key={i}
              type="button"
              className={`slot ${idx !== undefined ? "filled" : ""}`}
              disabled={state === "good" || idx === undefined}
              onClick={() => {
                sfx.click();
                setState("idle");
                setPicked((p) => p.filter((_, j) => j !== i));
              }}
            >
              {idx !== undefined ? items[idx] : i + 1}
            </button>
          );
        })}
      </div>
      {state !== "good" && (
        <div className="order-pool">
          {items.map((w, idx) => (
            <button
              key={idx}
              type="button"
              className="card"
              disabled={picked.includes(idx) || picked.length >= answer.length}
              onClick={() => pick(idx)}
            >
              {w}
            </button>
          ))}
        </div>
      )}
      {state === "bad" && (
        <div className="soft-hint">
          {wrongText}{" "}
          <button type="button" className="link" onClick={() => { setPicked([]); setState("idle"); }}>
            Сбросить
          </button>
        </div>
      )}
      {state === "good" && <div className="order-result">«{result ?? answer.join(joiner)}»</div>}
    </div>
  );
}

/* ---------- hints ---------- */

export function Hints({ list, label }: { list: string[]; label?: string }) {
  const g = useGame();
  const [open, setOpen] = useState(0);
  const guide = g.has("guide");
  return (
    <div className="hints">
      {open > 0 && (
        <ol className="hint-list">
          {list.slice(0, open).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      )}
      {open < list.length && (
        <button
          type="button"
          className={`btn small ghost hint-btn ${guide ? "guide" : ""}`}
          onClick={() => {
            sfx.click();
            setOpen((n) => n + 1);
          }}
        >
          {guide && <Pix name="guideMark" size={2} />}
          {label ?? (guide ? "Ласточка подскажет" : "Подсказка")} {open > 0 ? `(${open}/${list.length})` : ""}
        </button>
      )}
    </div>
  );
}

/* ---------- items ---------- */

export function ItemIcon({ id, size = 3 }: { id: ItemId; size?: number }) {
  const info = ITEMS[id];
  if (info.glyph) return <span className="glyph" style={{ fontSize: size * 7 }}>{info.glyph}</span>;
  return <Pix name={info.sprite ?? "note"} size={size} />;
}

/** "Карманы путешественника" picker for using an item on something. */
export function ItemPicker({
  title,
  correct,
  onSuccess,
  onClose,
  wrongText = "Не подходит. Попробуй другой предмет.",
}: {
  title: string;
  correct: ItemId;
  onSuccess: () => void;
  onClose: () => void;
  wrongText?: string;
}) {
  const g = useGame();
  const [bad, setBad] = useState<{ id: ItemId; n: number } | null>(null);
  const [good, setGood] = useState(false);
  const items = g.items.filter((i) => !ITEMS[i].secret);
  return (
    <Modal onClose={onClose} className="pockets-modal">
        <div className="panel-title">{title}</div>
        <div className="pocket-grid">
          {items.map((id) => {
            const isBad = bad?.id === id;
            return (
              <button
                key={isBad ? `${id}-${bad.n}` : id}
                type="button"
                className={`pocket ${isBad ? "bad shake" : ""} ${good && id === correct ? "good" : ""}`}
                disabled={good}
                onClick={() => {
                  if (id === correct) {
                    sfx.ok();
                    setGood(true);
                    window.setTimeout(onSuccess, 700);
                  } else {
                    sfx.wrong();
                    setBad({ id, n: (bad?.n ?? 0) + 1 });
                  }
                }}
              >
                <ItemIcon id={id} />
                <span>{ITEMS[id].name}</span>
              </button>
            );
          })}
        </div>
        {bad && !good && <div className="soft-hint">{wrongText}</div>}
        <Btn className="ghost small" onClick={onClose}>
          Закрыть
        </Btn>
    </Modal>
  );
}

export function Modal({ children, onClose, className = "" }: { children: ReactNode; onClose?: () => void; className?: string }) {
  return createPortal(
    <div className="modal-back" onClick={onClose}>
      <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
