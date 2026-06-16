import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world ${getRandomEmoji()}`
            }
          ]
        },
      });
    }

    if (name === '8ball') {
      const question = data.options.find(o => o.name === 'question').value;
      const answers = [
        'It is certain.', 'It is decidedly so.', 'Without a doubt.',
        'Yes, definitely.', 'You may rely on it.', 'As I see it, yes.',
        'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
        'Cannot predict now.', 'Concentrate and ask again.',
        "Don't count on it.", 'My reply is no.', 'My sources say no.',
        'Outlook not so good.', 'Very doubtful.',
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `🎱 **${question}**\n\n${answer}` }],
        },
      });
    }

    if (name === 'coinflip') {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const emoji = result === 'Heads' ? '🌝' : '🌚';
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `🪙 The coin landed on... **${result}!** ${emoji}` }],
        },
      });
    }

    if (name === 'roll') {
      const input = data.options?.find(o => o.name === 'dice')?.value ?? '1d6';
      const match = input.toLowerCase().match(/^(\d*)d(\d+)$/);
      if (!match) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: '❌ Invalid format. Try something like `2d6` or `d20`.' }],
          },
        });
      }
      const count = Math.min(parseInt(match[1] || '1', 10), 20);
      const sides = Math.min(parseInt(match[2], 10), 1000);
      if (count < 1 || sides < 2) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: '❌ Need at least 1 die with 2+ sides.' }],
          },
        });
      }
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      const detail = count > 1 ? ` *(${rolls.join(' + ')})*` : '';
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `🎲 Rolling **${count}d${sides}**... **${total}**${detail}` }],
        },
      });
    }

    if (name === 'joke') {
      const jokes = [
        { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
        { setup: "I told my wife she should embrace her mistakes.", punchline: "She gave me a hug." },
        { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field." },
        { setup: "I only know 25 letters of the alphabet.", punchline: "I don't know why." },
        { setup: "Why can't a bicycle stand on its own?", punchline: "Because it's two-tired." },
        { setup: "What do you call a fish without eyes?", punchline: "A fsh." },
        { setup: "Did you hear about the mathematician who's afraid of negative numbers?", punchline: "He'll stop at nothing to avoid them." },
        { setup: "Why do cows wear bells?", punchline: "Because their horns don't work." },
        { setup: "I asked my dog what 2 minus 2 is.", punchline: "He said nothing." },
        { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up." },
        { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese." },
        { setup: "I used to hate facial hair...", punchline: "...but then it grew on me." },
        { setup: "Why did the invisible man turn down the job offer?", punchline: "He couldn't see himself doing it." },
        { setup: "What do you call a boomerang that won't come back?", punchline: "A stick." },
        { setup: "Why did the programmer quit his job?", punchline: "Because he didn't get arrays." },
      ];
      const { setup, punchline } = jokes[Math.floor(Math.random() * jokes.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `😄 ${setup}\n\n||${punchline}||` }],
        },
      });
    }

    if (name === 'ship') {
      const user1Id = data.options.find(o => o.name === 'user1').value;
      const user2Id = data.options.find(o => o.name === 'user2').value;
      const user1 = data.resolved.users[user1Id];
      const user2 = data.resolved.users[user2Id];
      // Deterministic score so the same pair always gets the same result
      const combined = [user1Id, user2Id].sort().join('');
      const hash = [...combined].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const score = hash % 101;
      const filled = Math.round(score / 10);
      const bar = '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);
      const verdict =
        score >= 90 ? "Soulmates!! 💞" :
        score >= 70 ? "Great match! 💖" :
        score >= 50 ? "Pretty compatible 😊" :
        score >= 30 ? "Could work with effort 🤷" :
        "Maybe just friends? 👀";
      const name1 = user1.global_name ?? user1.username;
      const name2 = user2.global_name ?? user2.username;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{
            type: MessageComponentTypes.TEXT_DISPLAY,
            content: `💘 **Ship-O-Meter**\n\n${name1} 💕 ${name2}\n\n${bar}\n\n**${score}% compatible** — ${verdict}`,
          }],
        },
      });
    }

    if (name === 'challenge') {
      const userId = req.body.member?.user?.id ?? req.body.user?.id;
      const objectName = data.options[0].value;
      // Store challenger's pick keyed by this interaction's ID
      activeGames[id] = { id: userId, objectName };
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: `<@${userId}> wants to play Rock Paper Scissors! Click to accept.`,
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [{
                type: MessageComponentTypes.BUTTON,
                label: 'Accept Challenge',
                style: ButtonStyleTypes.PRIMARY,
                custom_id: `accept_button_${id}`,
              }],
            },
          ],
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    const { custom_id, values } = data;
    const userId = req.body.member?.user?.id ?? req.body.user?.id;

    // Button clicked — show ephemeral select menu so opponent picks their object
    if (custom_id.startsWith('accept_button_')) {
      const gameId = custom_id.replace('accept_button_', '');
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2 | InteractionResponseFlags.EPHEMERAL,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: 'Pick your weapon!',
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [{
                type: MessageComponentTypes.STRING_SELECT,
                custom_id: `select_choice_${gameId}`,
                placeholder: 'Choose your object...',
                options: getShuffledOptions(),
              }],
            },
          ],
        },
      });
    }

    // Select picked — resolve the game and post the result
    if (custom_id.startsWith('select_choice_')) {
      const gameId = custom_id.replace('select_choice_', '');
      const game = activeGames[gameId];
      delete activeGames[gameId];

      if (!game) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2 | InteractionResponseFlags.EPHEMERAL,
            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'Game not found — it may have already been played!' }],
          },
        });
      }

      const p2 = { id: userId, objectName: values[0] };
      const resultStr = getResult(game, p2);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: resultStr }],
        },
      });
    }
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
