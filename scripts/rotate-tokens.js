import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generateSecureToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function updateEnvFile(tokenName, newToken) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove old token if exists
  const tokenRegex = new RegExp(`^${tokenName}=.*$`, 'm');
  envContent = envContent.replace(tokenRegex, '');

  // Add new token
  envContent += `\n${tokenName}=${newToken}\n`;

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log(`✅ Updated ${tokenName} in .env file`);
}

function rotateTokens() {
  const tokens = {
    JWT_SECRET: generateSecureToken(),
    EMAIL_LINK_SECRET: generateSecureToken(),
  };

  Object.entries(tokens).forEach(([name, token]) => {
    updateEnvFile(name, token);
    console.log(`🔑 Generated new ${name}: ${token}`);
  });

  console.log('\n⚠️  IMPORTANT: Update these tokens in:');
  console.log('1. GitHub Secrets (Settings → Secrets → Actions)');
  console.log('2. Vercel Environment Variables');
  console.log('3. Any other deployment environments');
}

rotateTokens(); 