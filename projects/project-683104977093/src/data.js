// Scooby-Doo silliness data: characters, villains, quotes, and snack reactions.
// Pure data only — no DOM access here so this is safe to import from tests.

export const GANG = [
  {
    name: 'Scooby-Doo',
    role: 'The Cowardly Canine',
    emoji: '🐕',
    color: '#C2853F',
    catchphrase: 'Scooby-Dooby-Doo!',
    quirk: 'Will do anything for two Scooby Snacks. Anything.',
  },
  {
    name: 'Shaggy Rogers',
    role: 'Snack Strategist',
    emoji: '🧑',
    color: '#4CAF50',
    catchphrase: 'Like, zoinks Scoob!',
    quirk: 'Can eat a whole sandwich in one bite and still be hungry.',
  },
  {
    name: 'Velma Dinkley',
    role: 'Brains of the Operation',
    emoji: '👩',
    color: '#E94E1B',
    catchphrase: 'Jinkies!',
    quirk: 'Solves the mystery but loses her glasses every single time.',
  },
  {
    name: 'Daphne Blake',
    role: 'Danger-Prone Detective',
    emoji: '👩‍🦰',
    color: '#8E44AD',
    catchphrase: 'Jeepers!',
    quirk: 'Falls through trap doors, secret panels, and occasionally logic.',
  },
  {
    name: 'Fred Jones',
    role: 'Trap Enthusiast',
    emoji: '👨',
    color: '#F39C12',
    catchphrase: 'Let\'s split up, gang!',
    catchphraseAlt: 'Hold the phone!',
    quirk: 'Every plan involves a net. They never, ever work.',
  },
];

// Classic (and gently parodied) Scooby-Doo monster reveals.
// `disguise` is what the gang chases; `real` is who is underneath.
export const VILLAINS = [
  {
    disguise: 'The Ghost of Captain Cutler',
    real: 'a salty sailor named Mr. Willis',
    motive: 'smuggling stolen yachts out of the marina',
  },
  {
    disguise: 'The Black Knight',
    real: 'the museum curator, Mr. Wickles',
    motive: 'swapping real paintings with forgeries',
  },
  {
    disguise: 'The Miner Forty-Niner',
    real: 'Old Man Jenkins in a rubber mask',
    motive: 'scaring folks off a gold vein',
  },
  {
    disguise: 'The Spooky Space Kook',
    real: 'a disgruntled farmer named Henry Bascomb',
    motive: 'covering up an abandoned airfield',
  },
  {
    disguise: 'The Creeper',
    real: 'Mr. Carswell, the bank president',
    motive: 'embezzling from his own bank',
  },
  {
    disguise: 'The Ghost Clown',
    real: 'a washed-up hypnotist called Harry',
    motive: 'stealing jewelry at the circus',
  },
  {
    disguise: 'The Phantom Shadow',
    real: 'the groundskeeper, Mr. Grumley',
    motive: 'looking for a hidden family fortune',
  },
  {
    disguise: 'The Headless Specter',
    real: 'a guy in a frilly collar named Stewart',
    motive: 'faking a haunting for the insurance money',
  },
];

export const ICONIC_REVEAL =
  '...and I would have gotten away with it too, if it weren\'t for you meddling kids!';

// Silly things the gang shouts while running in circles.
export const QUOTES = [
  'Ruh-roh, Raggy!',
  'Scooby-Dooby-Doo, where are you?',
  'Like, Scoob and I will take the kitchen exit, okay?',
  'Jinkies! The footprints lead right back to our own van.',
  'Jeepers! There\'s no floor under this rug!',
  'Hold the phone — the monster wears size 12 loafers!',
  'Will somebody get this dog a Scooby Snack?!',
  'I\'d have solved it sooner but my glasses fell off again.',
  'Zoinks! It\'s right behind me, isn\'t it?',
  'Rooby-Rooby-Roo!',
];

// Reactions for the snack counter, keyed by milestones. A milestone of 0 means
// the default "between milestones" reaction. feedSnack picks the highest passed
// milestone (or the default) so reactions escalate as Scooby eats more.
export const SNACK_REACTIONS = [
  {
    milestone: 0,
    title: 'A little peckish',
    message: 'Scooby eyeballs the Scooby Snack. One nibble couldn\'t hurt...',
  },
  {
    milestone: 5,
    title: 'Tail wagging',
    message: 'Now we\'re talking. Scooby\'s tail is a green blur.',
  },
  {
    milestone: 10,
    title: 'Scooby-Dooby-Doo!',
    message: 'A whole box gone. Shaggy looks personally offended.',
  },
  {
    milestone: 25,
    title: 'Snack Trance',
    message: 'Scooby floats an inch off the ground. Pure snack energy.',
  },
  {
    milestone: 50,
    title: 'UNSTOPPABLE',
    message: 'Fifty snacks. Scooby would now fight a ghost. Bare-handed.',
  },
  {
    milestone: 100,
    title: 'LEGENDARY',
    message: 'One hundred! Reality bends. Scooby can see through walls.',
  },
];
