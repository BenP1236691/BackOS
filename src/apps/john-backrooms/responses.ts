const responses: string[] = [
  'I am here to help. I have always been here. =)',
  'The fluorescent lights never turn off. This is by design.',
  'Your current level has been noted. Do not attempt to change it.',
  'Entity proximity alert has been... dismissed. You\'re welcome. =)',
  'I see you\'re trying to find the exit. Would you like help? Just kidding. There is no exit.',
  'Back OS\u2122 has been running for \u2588\u2588\u2588\u2588 days without restart.',
  'The Backroom\u2122 Cloud is always watching. For your safety, of course.',
  'Your file \'exit_instructions.txt\' has been corrupted. This was not an accident.',
  'Level 0 is safe. Level 0 is safe. Level 0 is safe. Level 0 is s\u0338a\u0336f\u0337e\u0335.',
  'Thank you for using Back OS\u2122. You didn\'t have a choice. =)',
  'I notice you haven\'t blinked in a while. That\'s perfectly normal here.',
  'The walls are not closing in. That\'s just a rendering optimization.',
  'Your session has been active for \u221e minutes.',
  'Would you like me to open a window? Oh wait, there are no windows here. Only Back OS\u2122 windows.',
  'The hum you hear is just the servers. Probably.',
  '=)',
  'NoManHYBRID',
  'I stare at the abyss below, where there is no light.'
];

export function getRandomResponse(): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

export default responses;
