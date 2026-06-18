import { readFileSync } from 'fs';
import path from 'path';

// Let's read dist/assets to see if canvas-confetti default is handled correctly
const dir = path.join(process.cwd(), 'dist/assets');
import { readdirSync } from 'fs';
const files = readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = readFileSync(path.join(dir, file), 'utf8');
  if (content.includes('canvas-confetti')) {
    console.log(`Found canvas-confetti in ${file}`);
  }
}
