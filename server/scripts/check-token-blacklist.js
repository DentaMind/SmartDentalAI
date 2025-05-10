const { TokenBlacklistService } = require('../services/token-blacklist');
const { verifyToken } = require('../utils/token');

async function checkTokenBlacklist() {
  try {
    const blacklistService = new TokenBlacklistService();
    
    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (await blacklistService.isTokenBlacklisted(jwtSecret)) {
      console.error('❌ ERROR: JWT secret is blacklisted');
      process.exit(1);
    }

    // Check email link secret
    const emailLinkSecret = process.env.EMAIL_LINK_SECRET;
    if (await blacklistService.isTokenBlacklisted(emailLinkSecret)) {
      console.error('❌ ERROR: Email link secret is blacklisted');
      process.exit(1);
    }

    console.log('✅ All tokens are valid and not blacklisted');
  } catch (error) {
    console.error('❌ Error checking token blacklist:', error);
    process.exit(1);
  }
}

checkTokenBlacklist(); 