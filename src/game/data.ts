export type SceneId =
  | "title"
  | "desktop"
  | "terminal"
  | "l1" | "search" | "l2" | "l3" | "l4" | "l5" | "l6" | "caesar" | "l7" | "snake" | "l8" | "l9" | "question"
  | "l10" | "l11" | "l12" | "l13" | "l14" | "l15" | "l16" | "code" | "l17"
  | "home"
  | "l18"
  | "gallery";

export interface SceneInfo {
  id: SceneId;
  /** "Уровень N. …", numbered automatically from story order. */
  title?: string;
  chapter?: string;
  rewards?: ItemId[];
}

const CH1 = "Глава I. Инициализация";
const CH2 = "Глава II. Новые спутники";
const CH3 = "Глава III. Следы прошлого";
const CH4 = "Глава IV. Тайная комната";
const CH5 = "Глава V. Дом";

// Linear story order. Scenes with a `name` are numbered levels; the gallery sits outside the order.
const STORY: (Omit<SceneInfo, "title"> & { name?: string })[] = [
  { id: "title" },
  { id: "desktop" },
  { id: "terminal" },
  { id: "l1", name: "Первый запуск", chapter: CH1, rewards: ["password"] },
  { id: "search", name: "Поиск", chapter: CH1, rewards: ["discord"] },
  { id: "l2", name: "Двоичный шифр", chapter: CH1, rewards: ["fragment"] },
  { id: "l3", name: "Дата релиза", chapter: CH1, rewards: ["candle", "shardH"] },
  { id: "l4", name: "Проводник", chapter: CH2, rewards: ["guide"] },
  { id: "l5", name: "Буба и запертый сундук", chapter: CH2, rewards: ["chestKey", "forestMap"] },
  { id: "l6", name: "Чомик знает дорогу", chapter: CH2, rewards: ["pathMap"] },
  { id: "caesar", name: "Шифр Чомика", chapter: CH2, rewards: ["caesarNote"] },
  { id: "l7", name: "Клад в лесу", chapter: CH2, rewards: ["aruku", "shardO"] },
  { id: "snake", name: "Змейка", chapter: CH2, rewards: ["pass"] },
  { id: "l8", name: "Сервер Aruku", chapter: CH3, rewards: ["mapPiece"] },
  { id: "l9", name: "Потерянное сообщение", chapter: CH3, rewards: ["memory"] },
  { id: "question", name: "Вопрос", chapter: CH3 },
  { id: "l10", name: "Почтальон времени", chapter: CH3, rewards: ["seal"] },
  { id: "l11", name: "Почти три года", chapter: CH3, rewards: ["hourglass"] },
  { id: "l12", name: "Четыре этапа", chapter: CH3, rewards: ["silverKey"] },
  { id: "l13", name: "Кто такая Ласточка?", chapter: CH4, rewards: ["feather", "shardE"] },
  { id: "l14", name: "Словарь прозвищ", chapter: CH4, rewards: ["symbols"] },
  { id: "l15", name: "Тайная библиотека", chapter: CH4, rewards: ["letter", "shardM"] },
  { id: "l16", name: "Пять лучших качеств", chapter: CH4, rewards: ["stars"] },
  { id: "code", name: "Код", chapter: CH5, rewards: ["codeLine"] },
  { id: "l17", name: "Последний пароль", chapter: CH5 },
  { id: "home", chapter: CH5 },
  { id: "l18", name: "Дом — это мы", chapter: CH5 },
];

let levelNo = 0;
export const SCENES: SceneInfo[] = STORY.map(({ name, ...s }) => (name ? { ...s, title: `Уровень ${++levelNo}. ${name}` } : s));
export const LEVEL_COUNT = levelNo;

export function sceneIndex(id: SceneId) {
  return SCENES.findIndex((s) => s.id === id);
}

export type ItemId =
  | "password" | "fragment" | "candle" | "guide" | "chestKey" | "forestMap"
  | "pathMap" | "aruku" | "mapPiece" | "memory" | "seal" | "hourglass"
  | "silverKey" | "feather" | "symbols" | "letter" | "stars"
  | "shardH" | "shardO" | "shardM" | "shardE"
  | "discord" | "caesarNote" | "codeLine" | "pass"
  | "coin" | "note22";

export interface ItemInfo {
  name: string;
  desc: string;
  sprite?: string;
  glyph?: string;
  // Longer text shown when the item is opened from the pockets.
  read?: string;
  secret?: boolean;
}

export const ITEMS: Record<ItemId, ItemInfo> = {
  password: { name: "Пароль", desc: "Вывод твоего первого кода: 10.11.2004. Пригодится.", sprite: "note" },
  fragment: { name: "Фрагмент послания", desc: "«Пусть все сбудется». Это пожелание — тебе.", sprite: "envelope" },
  candle: { name: "Золотая свеча", desc: "Горит с самого релиза — с 10.11.2004.", sprite: "candleGold" },
  guide: { name: "Знак проводника", desc: "Там, где он светится, Ласточка может подсказать.", sprite: "guideMark" },
  chestKey: { name: "Ключ от сундука", desc: "Старый золотой ключ. Похоже, подходит не к одному замку.", sprite: "key" },
  forestMap: { name: "Карта леса", desc: "На ней отмечено старое дерево и крестик рядом с ним.", sprite: "map" },
  pathMap: { name: "Карта тайного прохода", desc: "Чомик нарисовал короткий путь. Лапой.", sprite: "map" },
  aruku: { name: "Записка ARUKU", desc: "На клочке бумаги одно слово: ARUKU.", sprite: "note" },
  mapPiece: { name: "Фрагмент карты", desc: "Отмечена точка START. Здесь всё началось.", sprite: "map" },
  memory: {
    name: "Восстановленное воспоминание",
    desc: "Вы встретились на Aruku.",
    sprite: "envelope",
    read: "Сначала — просто ник в списке участников сервера.\nПотом — одно сообщение. Потом ещё одно.\nА потом — разговоры, которые совсем не хотелось заканчивать.",
  },
  seal: { name: "Календарная печать", desc: "10 ноября. Самая важная дата в этом календаре.", sprite: "seal" },
  hourglass: { name: "Песочные часы воспоминаний", desc: "Почти три года. Песок в них не кончается.", sprite: "hourglass" },
  silverKey: { name: "Серебряный ключ", desc: "Открывает дверь в тайную комнату.", sprite: "silverKey" },
  feather: { name: "Перо Ласточки", desc: "Чёрное, с фиолетовым отблеском. Тёплое.", sprite: "feather" },
  symbols: { name: "Три символа воспоминаний", desc: "Буба, Чомик и Радость — светятся вместе.", sprite: "heart" },
  letter: {
    name: "Письмо из библиотеки",
    desc: "Нашлось за книжным шкафом.",
    sprite: "envelope",
    read: "Если ты читаешь это, значит, ты умеешь замечать мелочи.\nТёплые слова, звёзды без фотографий, дом, где тебя ждут, — всё это складывается из мелочей.\nОсталось совсем немного. Я жду тебя в конце пути. ♡",
  },
  discord: { name: "Пять символов Discord", desc: "Все пять нашлись в комнате. Кажется, кто-то очень ждёт тебя на сервере.", sprite: "discordIcon" },
  caesarNote: {
    name: "Записка Чомика",
    desc: "Iroorz wkh vzdoorz → Follow the swallow.",
    sprite: "note",
    read: "Follow the swallow — иди за ласточкой.\nЧомик говорит, это лучший совет, который он когда-либо расшифровывал.",
  },
  pass: { name: "Пропуск", desc: "Десять сердечек собраны — портал в прошлое открыт.", sprite: "heart" },
  codeLine: { name: "Строка кода", desc: "const home = you;", sprite: "note" },
  stars: { name: "Пять звёзд", desc: "Пять качеств, за которые тебя любят.", sprite: "star" },
  shardH: { name: "Осколок «H»", desc: "Светящаяся буква. Нашлась на торте.", glyph: "H" },
  shardO: { name: "Осколок «O»", desc: "Светящаяся буква. Лежала в лесном тайнике.", glyph: "O" },
  shardM: { name: "Осколок «M»", desc: "Светящаяся буква. Пряталась в библиотеке.", glyph: "M" },
  shardE: { name: "Осколок «E»", desc: "Светящаяся буква. Её принесла Ласточка.", glyph: "E" },
  coin: {
    name: "Старая монета",
    desc: "Секрет! Пряталась за деревом.",
    sprite: "coin",
    secret: true,
    read: "На одной стороне — ласточка, на другой — надпись «на удачу».\nБуба утверждает, что это его монета. Буба врёт.",
  },
  note22: {
    name: "Записка «22»",
    desc: "Секрет! Число, которое превращает идеи в реальность.",
    sprite: "note",
    secret: true,
    read: "22 — число мастера: оно превращает мечты в то, что можно потрогать.\n10 ноября тебе исполняется 22.\nПусть этот год сделает реальными все твои идеи — и самые смелые проекты тоже.",
  },
};

export const SHARDS: ItemId[] = ["shardH", "shardO", "shardM", "shardE"];

export function rewardsBefore(id: SceneId): ItemId[] {
  const idx = sceneIndex(id);
  return SCENES.slice(0, Math.max(idx, 0)).flatMap((s) => s.rewards ?? []);
}
