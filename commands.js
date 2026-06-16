import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const MAGIC8BALL_COMMAND = {
  name: '8ball',
  description: 'Ask the magic 8-ball a yes/no question',
  options: [
    {
      type: 3,
      name: 'question',
      description: 'Your question for the 8-ball',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const COINFLIP_COMMAND = {
  name: 'coinflip',
  description: 'Flip a coin!',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ROLL_COMMAND = {
  name: 'roll',
  description: 'Roll some dice',
  options: [
    {
      type: 3,
      name: 'dice',
      description: 'Dice notation, e.g. 2d6 or d20 (default: 1d6)',
      required: false,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const JOKE_COMMAND = {
  name: 'joke',
  description: 'Tell me a (terrible) joke',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const SHIP_COMMAND = {
  name: 'ship',
  description: 'Check the compatibility between two users',
  options: [
    {
      type: 6,
      name: 'user1',
      description: 'First person',
      required: true,
    },
    {
      type: 6,
      name: 'user2',
      description: 'Second person',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, MAGIC8BALL_COMMAND, COINFLIP_COMMAND, ROLL_COMMAND, JOKE_COMMAND, SHIP_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
