"use client";

import { useEffect, useState } from "react";
import { ITEMS, SCENES, type ItemId, type SceneId } from "../data";
import { Pix } from "../pixel/Sprite";
import { sfx } from "../sound";
import { useGame } from "../state";
import { Btn, ItemIcon, Modal } from "./kit";

const NO_HUD: SceneId[] = ["title", "gallery"];

export function Hud() {
  const g = useGame();
  const [pockets, setPockets] = useState(false);
  const [menu, setMenu] = useState(false);
  const info = SCENES.find((s) => s.id === g.scene);

  if (NO_HUD.includes(g.scene)) return null;
  const showPockets = g.items.length > 0;

  return (
    <>
      {info?.title && (
        <div className="hud-badge">
          <span className="hud-icon">▣</span> {info.title}
        </div>
      )}
      <div className="hud-buttons">
        {showPockets && (
          <button type="button" className="hud-btn" onClick={() => { sfx.click(); setPockets(true); }} title="Карманы путешественника">
            <Pix name="chestClosed" size={2} />
            <span className="hud-count">{g.items.length}</span>
          </button>
        )}
        <button type="button" className="hud-btn" onClick={g.toggleMute} title={g.muted ? "Включить звук" : "Выключить звук"}>
          {g.muted ? "♪̸" : "♪"}
        </button>
        <button type="button" className="hud-btn" onClick={() => { sfx.click(); setMenu(true); }} title="Меню">
          ≡
        </button>
      </div>
      {pockets && <Pockets onClose={() => setPockets(false)} />}
      {menu && <Menu onClose={() => setMenu(false)} />}
      <ChapterSplash />
    </>
  );
}

function ChapterSplash() {
  const g = useGame();
  const chapter = SCENES.find((s) => s.id === g.scene)?.chapter;
  const [seen, setSeen] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState<string | null>(null);

  // Show the splash once each time the chapter changes (state adjusted during render).
  if (chapter && chapter !== seen) {
    setSeen(chapter);
    setVisible(chapter);
  }

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(null), 2600);
    return () => window.clearTimeout(id);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="chapter-splash" onClick={() => setVisible(null)}>
      <div>{visible}</div>
    </div>
  );
}

export function Pockets({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const [sel, setSel] = useState<ItemId | null>(null);
  const regular = g.items.filter((i) => !ITEMS[i].secret);
  const secrets = g.items.filter((i) => ITEMS[i].secret);
  const item = sel ? ITEMS[sel] : null;
  return (
    <Modal onClose={onClose} className="pockets-modal">
      <div className="panel-title">Карманы путешественника</div>
      <div className="pocket-grid">
        {regular.map((id) => (
          <button key={id} type="button" className={`pocket ${sel === id ? "active" : ""}`} onClick={() => { sfx.click(); setSel(id); }}>
            <ItemIcon id={id} />
            <span>{ITEMS[id].name}</span>
          </button>
        ))}
      </div>
      {secrets.length > 0 && (
        <>
          <div className="pocket-sub">Секреты · {secrets.length}</div>
          <div className="pocket-grid">
            {secrets.map((id) => (
              <button key={id} type="button" className={`pocket secret ${sel === id ? "active" : ""}`} onClick={() => { sfx.click(); setSel(id); }}>
                <ItemIcon id={id} />
                <span>{ITEMS[id].name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="pocket-detail">
        {item ? (
          <>
            <b>{item.name}</b>
            <p>{item.desc}</p>
            {item.read && <p className="pocket-read">{item.read}</p>}
            {sel === "stars" && g.qualities.length > 0 && <p className="pocket-read">{g.qualities.join(" · ")}</p>}
          </>
        ) : (
          <p className="muted">Нажми на предмет, чтобы рассмотреть его.</p>
        )}
      </div>
      <Btn className="ghost small" onClick={onClose}>
        Закрыть
      </Btn>
    </Modal>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal onClose={onClose} className="menu-modal">
      <div className="panel-title">Пауза</div>
      <div className="menu-list">
        <Btn className="primary" onClick={onClose}>
          Продолжить
        </Btn>
        <Btn
          onClick={() => {
            onClose();
            g.goTo("title");
          }}
        >
          На главный экран
        </Btn>
        <Btn onClick={g.toggleMute}>Звук: {g.muted ? "выкл" : "вкл"}</Btn>
        {!confirm ? (
          <Btn className="ghost" onClick={() => setConfirm(true)}>
            Начать заново
          </Btn>
        ) : (
          <div className="confirm">
            <p>Весь прогресс и найденные предметы пропадут. Точно?</p>
            <div className="row">
              <Btn
                className="danger"
                onClick={() => {
                  g.reset();
                  onClose();
                  g.goTo("title");
                }}
              >
                Да, заново
              </Btn>
              <Btn className="ghost" onClick={() => setConfirm(false)}>
                Нет
              </Btn>
            </div>
          </div>
        )}
        {g.debug && (
          <label className="debug">
            debug: перейти к
            <select
              value={g.scene}
              onChange={(e) => {
                g.jump(e.target.value as SceneId);
                onClose();
              }}
            >
              {SCENES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} {s.title ?? ""}
                </option>
              ))}
              <option value="gallery">gallery</option>
            </select>
          </label>
        )}
      </div>
    </Modal>
  );
}

export function Toasts() {
  const g = useGame();
  return (
    <div className="toasts">
      {g.toasts.slice(0, 3).map((t) => (
        <div key={t.id} className="toast">
          <ItemIcon id={t.item} size={2} />
          <span>
            Получено: <b>{ITEMS[t.item].name}</b>
          </span>
        </div>
      ))}
    </div>
  );
}
