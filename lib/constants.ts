export const TYPE_COLORS: Record<string, string> = {
  normal:   '#9099A1',
  fire:     '#FF7034',
  water:    '#4D90D5',
  electric: '#F4D23C',
  grass:    '#63BC5A',
  ice:      '#74CEC0',
  fighting: '#CE416B',
  poison:   '#AB6AC8',
  ground:   '#D97845',
  flying:   '#89AAE3',
  psychic:  '#FA7179',
  bug:      '#91C12F',
  rock:     '#C5B78C',
  ghost:    '#5269AC',
  dragon:   '#0B6DC3',
  dark:     '#5A5465',
  steel:    '#5A8EA2',
  fairy:    '#EC8FE6',
};

export const STAT_CONFIG: Record<string, { label: string; color: string }> = {
  hp:                { label: 'HP',     color: '#FC6C6D' },
  attack:            { label: 'ATK',    color: '#F5AC78' },
  defense:           { label: 'DEF',    color: '#F5D57B' },
  'special-attack':  { label: 'SP.ATK', color: '#9DB7F5' },
  'special-defense': { label: 'SP.DEF', color: '#A7DB8D' },
  speed:             { label: 'SPD',    color: '#FA92B2' },
};

export const ALL_TYPES = Object.keys(TYPE_COLORS);

export const VERSION_PRIORITY = [
  'scarlet-violet', 'the-teal-mask', 'the-indigo-disk',
  'sword-shield', 'sun-moon', 'ultra-sun-ultra-moon',
  'x-y', 'omega-ruby-alpha-sapphire',
  'black-2-white-2', 'black-white',
  'heartgold-soulsilver', 'platinum', 'diamond-pearl',
  'firered-leafgreen', 'emerald', 'ruby-sapphire',
  'crystal', 'gold-silver', 'yellow', 'red-blue',
];
