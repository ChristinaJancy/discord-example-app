import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKey,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');

    const isValid = await verifyKey(body, signature, timestamp, env.PUBLIC_KEY);
    if (!isValid) {
      return new Response('Bad request signature', { status: 401 });
    }

    const { type, data, id, member, user } = JSON.parse(body);
    const userId = member?.user?.id ?? user?.id;

    if (type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      if (name === 'test') {
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: `hello world ${getRandomEmoji()}` }],
          },
        });
      }

      if (name === 'challenge') {
        const objectName = data.options[0].value;
        // Encode challenger's userId + pick in the custom_id — no server-side storage needed
        return Response.json({
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
                  custom_id: `accept|${userId}|${objectName}`,
                }],
              },
            ],
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
        return Response.json({
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
        return Response.json({
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
          return Response.json({
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
          return Response.json({
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
        return Response.json({
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
        return Response.json({
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
        const combined = [user1Id, user2Id].sort().join('');
        const hash = [...combined].reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const score = hash % 101;
        const filled = Math.round(score / 10);
        const bar = '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);
        const verdict =
          score >= 90 ? 'Soulmates!! 💞' :
          score >= 70 ? 'Great match! 💖' :
          score >= 50 ? 'Pretty compatible 😊' :
          score >= 30 ? 'Could work with effort 🤷' :
          'Maybe just friends? 👀';
        const name1 = user1.global_name ?? user1.username;
        const name2 = user2.global_name ?? user2.username;
        return Response.json({
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

      return Response.json({ error: 'unknown command' }, { status: 400 });
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
      const { custom_id, values } = data;

      // Button clicked — show ephemeral select menu for the opponent to pick
      if (custom_id.startsWith('accept|')) {
        const [, challengerId, objectName] = custom_id.split('|');
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2 | InteractionResponseFlags.EPHEMERAL,
            components: [
              { type: MessageComponentTypes.TEXT_DISPLAY, content: 'Pick your weapon!' },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [{
                  type: MessageComponentTypes.STRING_SELECT,
                  custom_id: `pick|${challengerId}|${objectName}`,
                  placeholder: 'Choose your object...',
                  options: getShuffledOptions(),
                }],
              },
            ],
          },
        });
      }

      // Select made — resolve the game
      if (custom_id.startsWith('pick|')) {
        const [, challengerId, challengerObject] = custom_id.split('|');
        const p1 = { id: challengerId, objectName: challengerObject };
        const p2 = { id: userId, objectName: values[0] };
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: getResult(p1, p2) }],
          },
        });
      }
    }

    return Response.json({ error: 'unknown interaction type' }, { status: 400 });
  },
};
