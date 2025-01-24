import nacl from 'tweetnacl';
const Buffer = require('buffer/').Buffer;

async function handleRequest(request, env) {
    if (request.method === 'POST') {
      const req = await request.json();
  
      const headers = request.headers;
      const PUBLIC_KEY = env.DISCORD_PUBLIC_KEY;
      const signature = headers.get('X-Signature-Ed25519');
      const timestamp = headers.get('X-Signature-Timestamp');
  
      if (signature && timestamp) {
        const isVerified = nacl.sign.detached.verify(
          Buffer(timestamp + JSON.stringify(req)),
          Buffer(signature, 'hex'),
          Buffer(PUBLIC_KEY, 'hex'),
        );
  
        if (!isVerified) {
          return new Response(JSON.stringify(req), { status: 401 });
        } else {
          return new Response(JSON.stringify(req), { status: 200 });
        }
      }
    }
  }