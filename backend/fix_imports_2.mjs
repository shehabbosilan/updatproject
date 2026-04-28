import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove existing prisma client creation
  content = content.replace('import pkg from "@prisma/client";\nconst { PrismaClient } = pkg;', '');
  content = content.replace('import { PrismaClient } from "@prisma/client";', '');
  content = content.replace('const prisma = new PrismaClient();', '');
  
  // Add new import at the top
  const importStatement = `import { prisma } from "${file.includes('routes') ? '../prismaClient.mjs' : './prismaClient.mjs'}";\n`;
  content = importStatement + content;
  
  fs.writeFileSync(file, content);
};

replaceInFile(path.join(__dirname, 'migrate.mjs'));

const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(f => {
  if(f.endsWith('.mjs')) {
    replaceInFile(path.join(routesDir, f));
  }
});
console.log('Replaced with centralized Prisma client');
