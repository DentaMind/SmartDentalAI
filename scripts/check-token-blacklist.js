import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Add tokens to blacklist here
// Format: 'token-to-blacklist'
const BLACKLISTED_TOKENS = [
  // Add tokens here
].map(token => ({
  token,
  hash: crypto.createHash('sha256').update(token).digest('hex')
}));

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let found = false;

  BLACKLISTED_TOKENS.forEach(({ token, hash }) => {
    if (content.includes(token)) {
      console.error(`❌ Found blacklisted token in ${filePath}: ${token}`);
      found = true;
    }
    if (content.includes(hash)) {
      console.error(`❌ Found hash of blacklisted token in ${filePath}: ${hash}`);
      found = true;
    }
  });

  return found;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let found = false;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (scanDirectory(filePath)) {
        found = true;
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json')) {
      if (scanFile(filePath)) {
        found = true;
      }
    }
  }

  return found;
}

// Start scanning from the project root
const projectRoot = path.join(__dirname, '..');
const foundBlacklistedTokens = scanDirectory(projectRoot);

if (foundBlacklistedTokens) {
  console.error('\n❌ Blacklisted tokens found in the codebase. Please remove them before committing.');
  process.exit(1);
} else {
  console.log('✅ No blacklisted tokens found in the codebase.');
  process.exit(0);
} 