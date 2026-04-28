import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    'import { PrismaClient } from "@prisma/client";',
    'import pkg from "@prisma/client";\nconst { PrismaClient } = pkg;'
  );
  fs.writeFileSync(file, content);
};

replaceInFile(path.join(__dirname, 'migrate.mjs'));

const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(f => {
  if(f.endsWith('.mjs')) {
    replaceInFile(path.join(routesDir, f));
  }
});
console.log('Done');
