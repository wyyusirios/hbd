"use client";

import { ITEMS } from "../data";
import {
  BOARD,
  CAKE_ROOM,
  CHAT_SPACE,
  DIGITAL,
  DOOR_WALL,
  FOREST_CHEST,
  FOREST_CLEARING,
  FOREST_FORK,
  GARDEN,
  LIBRARY,
  PLAZA,
  SKY_DEEP,
  SKY_NIGHT,
  SKY_VIOLET,
  WALLPAPER,
  type Painter,
} from "../pixel/backgrounds";
import { PixelCanvas } from "../pixel/PixelCanvas";
import { Pix } from "../pixel/Sprite";
import { useGame } from "../state";
import { Btn } from "../ui/kit";
import { FullScene } from "../ui/Scene";

// Static versions of the backgrounds: a gallery of a dozen animated canvases would be wasteful.
const still = (p: Painter): Painter => ({ base: p.base });

const MEMORIES: { title: string; caption: string; bg: Painter | string; sprites: string[] }[] = [
  { title: "Запуск", caption: "Ты открыл PROJECT: YOU.", bg: "/img/room.webp", sprites: [] },
  { title: "Поиск", caption: "Пять спрятанных символов Discord.", bg: "/img/room.webp", sprites: ["discordIcon"] },
  { title: "10.11.2004", caption: "Первый код и самая важная дата.", bg: still(DIGITAL), sprites: ["note"] },
  { title: "Пусть все сбудется", caption: "Послание из нулей и единиц.", bg: still(BOARD), sprites: ["envelope"] },
  { title: "Релиз состоялся!", caption: "Торт, свечи и буква H.", bg: still(CAKE_ROOM), sprites: ["cake"] },
  { title: "Ласточка", caption: "Проводник, три звезды и тропа в лес.", bg: still(SKY_NIGHT), sprites: ["swallowA"] },
  { title: "Буба", caption: "Сундук открывается ключом, а не уговорами.", bg: still(FOREST_CHEST), sprites: ["buba", "chestOpen"] },
  { title: "Чомик", caption: "2, 4, 8, 16, 32 — и тайная тропа.", bg: still(FOREST_FORK), sprites: ["chomik"] },
  { title: "Шифр Чомика", caption: "Iroorz wkh vzdoorz — Follow the swallow.", bg: still(FOREST_FORK), sprites: ["chomik", "note"] },
  { title: "Клад", caption: "Записка ARUKU и буква O.", bg: still(FOREST_CLEARING), sprites: ["note", "mushroom"] },
  { title: "START", caption: "Discord-сервер Aruku. Здесь всё началось.", bg: still(CHAT_SPACE), sprites: ["heart"] },
  { title: "Почтальон времени", caption: "10 ноября — настоящая карточка.", bg: still(PLAZA), sprites: ["postman", "seal"] },
  { title: "Почти три года", caption: "Вселенная разговоров и шуток.", bg: still(SKY_DEEP), sprites: ["hourglass"] },
  { title: "Тайная библиотека", caption: "Сердце, звезда и дом.", bg: still(LIBRARY), sprites: ["envelope"] },
  { title: "Словарь прозвищ", caption: "Буба, Чомик, Радость.", bg: still(SKY_VIOLET), sprites: ["buba", "chomik", "heart"] },
  { title: "const home = you;", caption: "Строка кода, которая всё объясняет.", bg: still(BOARD), sprites: ["note"] },
  { title: "HOME", caption: "Четыре буквы, которые открыли дверь.", bg: still(DOOR_WALL), sprites: ["swallowPerch"] },
  { title: "Дом — это мы", caption: "Артём, Настя и двое лучших псов.", bg: still(GARDEN), sprites: ["schnauzerSide", "artemTall", "nastyaTall", "retrieverSide"] },
];

export function Gallery() {
  const g = useGame();
  const secrets = g.items.filter((i) => ITEMS[i].secret);

  return (
    <FullScene bg={WALLPAPER} className="gallery-scene">
      <div className="gallery">
        <h2 className="gallery-title">Воспоминания</h2>
        <div className="gallery-grid">
          {MEMORIES.map((m) => (
            <figure key={m.title} className="memory-card">
              <div className="mini-stage">
                {typeof m.bg === "string" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.bg} alt="" />
                ) : (
                  <PixelCanvas paint={m.bg} />
                )}
                <div className="mini-sprites">
                  {m.sprites.map((s, i) => (
                    <Pix key={i} name={s} size={2} />
                  ))}
                </div>
              </div>
              <figcaption>
                <b>{m.title}</b>
                <span>{m.caption}</span>
              </figcaption>
            </figure>
          ))}
          <figure className="memory-card text-card">
            <div className="stars-card">
              <b>Пять звёзд</b>
              {g.qualities.length ? (
                <ol>
                  {g.qualities.map((q, i) => (
                    <li key={i}>★ {q}</li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Звёзды ещё не зажжены.</p>
              )}
            </div>
          </figure>
          <figure className="memory-card text-card">
            <div className="stars-card">
              <b>Секреты: {secrets.length} из 2</b>
              {secrets.map((s) => (
                <p key={s}>◆ {ITEMS[s].name}</p>
              ))}
              {secrets.length < 2 && <p className="muted">Что-то ещё прячется — за деревом в лесу или в комнате с нулями и единицами.</p>}
            </div>
          </figure>
        </div>
        <div className="row center">
          <Btn className="primary" onClick={() => g.goTo("l18")}>
            ← К финалу
          </Btn>
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
      </div>
    </FullScene>
  );
}
