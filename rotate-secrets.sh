#!/bin/bash

# Script to guide through rotating exposed secrets
echo "🔐 Secret Rotation Guide for DentaMind"
echo "======================================="
echo "This script will guide you through the process of rotating exposed secrets."
echo "Exposed secrets in backend/config.env include:"
echo "  - SMTP_PASSWORD"
echo "  - TWILIO_AUTH_TOKEN"
echo "  - SECRET_KEY"
echo ""

echo "Step 1: Rotate SMTP Password"
echo "----------------------------"
echo "1. Log in to your email service provider"
echo "2. Navigate to security settings and regenerate the app password"
echo "3. Update the new password in your local .env file"
echo "4. Update the password in any deployment environments"
echo ""
read -p "Have you completed rotating the SMTP password? (y/n): " smtp_done
echo ""

echo "Step 2: Rotate Twilio Auth Token"
echo "-------------------------------"
echo "1. Log in to the Twilio dashboard: https://console.twilio.com/"
echo "2. Navigate to your project settings"
echo "3. Regenerate your AUTH TOKEN (NOT your Account SID)"
echo "4. Update the new token in your local .env file"
echo "5. Update the token in any deployment environments"
echo ""
read -p "Have you completed rotating the Twilio Auth Token? (y/n): " twilio_done
echo ""

echo "Step 3: Rotate Secret Key"
echo "------------------------"
echo "1. Generate a new secure random key:"
echo "   python -c 'import secrets; print(secrets.token_hex(32))'"
echo "2. Update SECRET_KEY in your local .env file"
echo "3. Update the key in any deployment environments"
echo "   NOTE: This will invalidate all current user sessions!"
echo ""
read -p "Have you completed rotating the Secret Key? (y/n): " secret_done
echo ""

if [[ "$smtp_done" == "y" && "$twilio_done" == "y" && "$secret_done" == "y" ]]; then
  echo "✅ Great! You've rotated all the exposed secrets."
  echo ""
  echo "Now create a new .env template with placeholders:"
  echo "cp .env .env.example"
  echo "sed -i '' 's/SMTP_PASSWORD=.*/SMTP_PASSWORD=your_smtp_password/' .env.example"
  echo "sed -i '' 's/TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=your_twilio_token/' .env.example"
  echo "sed -i '' 's/SECRET_KEY=.*/SECRET_KEY=your_secret_key/' .env.example"
  echo ""
  echo "Next: Follow Step 2 in your instructions to remove the secrets from Git history"
else
  echo "❌ Please make sure to rotate ALL exposed secrets before proceeding."
  echo "Run this script again when you've completed the rotation."
fi 