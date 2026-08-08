import { parseResumeText } from '../services/ai/resumeParserAgent';

const text = `
John Doe
Software Engineer
Experience:
- Worked at Google for 5 years
- Built a scalable backend in Node.js

Education:
- BS Computer Science, MIT

Skills:
- JavaScript, TypeScript, React, Node.js
`;

parseResumeText(text)
  .then(res => console.log('PARSED:', JSON.stringify(res, null, 2)))
  .catch(console.error);
