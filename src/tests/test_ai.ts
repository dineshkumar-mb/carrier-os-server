import { aiProvider } from '../services/ai/aiClient';

aiProvider.chat([{ role: 'system', content: 'You are a parser. Output strictly JSON.'}, { role: 'user', content: 'name: John Doe'}], { jsonMode: true })
  .then(console.log)
  .catch(console.error);
