import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKey,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';

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

    const { type, data } = JSON.parse(body);

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
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `hello world ${getRandomEmoji()}`,
              },
            ],
          },
        });
      }

      return Response.json({ error: 'unknown command' }, { status: 400 });
    }

    return Response.json({ error: 'unknown interaction type' }, { status: 400 });
  },
};
