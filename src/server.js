/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { EMOTE_COMMAND, INVITE_COMMAND } from './commands.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const router = AutoRouter();

// https://discord.com/developers/applications/1332250055763038280/emojis
const emojiList = [
  '<:doogee:1332396298896277525>',
  '<:molteseballoon:1332399719481344041>',
  '<:moltesedance:1332399508058931210>',
  '<:molteseheart:1332399533895712778>',
  '<:moltesehearts:1332400209107353650>',
  '<:molteselazy:1332403399509016617>',
  '<:moltesepeace:1332396153492209764>',
  '<:molteserefuse:1332403372837568666>',
  '<:molteseretrieverhappy:1332400848646443052>',
  '<:moltesesit:1332403457138622494>',
  '<:moltesesurprise:1332399740431892625>',
  '<:moltesewhere:1332403598071697408>',
  '<:oguangry:1332401380312485888>',
  '<:ogubday:1332401321118007428>',
  '<:ogucheer:1332402137778487318>',
  '<:oguchef:1332402112126128148>',
  '<:oguchill:1332401448226656328>',
  '<:ogucool:1332402313838596197>',
  '<:oguevil:1332401651943870576>',
  '<:oguexplore:1332402074553552906>',
  '<:oguflower:1332401736283066408>',
  '<:oguheart:1332401760366759987>',
  '<:oguhearts:1332401424277176412>',
  '<:oguhungry:1332401352835600514>',
  '<:ogujump:1332401707031859210>',
  '<:ogupainter:1332401294413004870>',
  '<:ogupoop:1332401678489751742>',
  '<:ogurefuse:1332401475447554149>',
  '<:ogushocked:1332402009113886822>',
  '<:ogushy:1332402283421503588>',
  '<:ogusideeye:1332402043050266655>',
  '<:oguwow:1332402487277387969>',
  '<:retrieverballoon:1332399699105157214>',
  '<:retrieverdepressed:1332403343380844595>',
  '<:retrieverheart:1332400261917839481>',
  '<:retrieverhearts:1332400233379795065>',
  '<:retrieverlazy:1332403270118932541>',
  '<:retrieversurprise:1332399766058831872>',
  '<:retrieverthumbsup:1332403309599789106>'
];

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case EMOTE_COMMAND.name.toLowerCase(): {
        // Send a message into the channel where command was triggered from
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: emojiList[Math.floor(Math.random() * emojiList.length)],
          },
        });
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        const applicationId = env.DISCORD_APPLICATION_ID;
        const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: INVITE_URL,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }
      default:
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
//router.all('*', () => new Response('Not Found.', { status: 404 }));
router.all('*', () => new Response('OK.', { status: 200 }));

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch,
};

export default server;
