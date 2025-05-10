import os
from typing import Dict, Any
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError
import json
from cryptography.fernet import Fernet

# Load environment variables
load_dotenv()

class SecretsManager:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.encryption_key = os.getenv("ENCRYPTION_KEY")
        self.fernet = Fernet(self.encryption_key.encode()) if self.encryption_key else None
        
        # AWS Secrets Manager configuration
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.aws_secret_name = f"dentamind/{self.environment}"
        
        # Initialize AWS client
        self.client = boto3.client(
            "secretsmanager",
            region_name=self.aws_region,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        ) if self.environment == "production" else None

    def get_secret(self, key: str) -> str:
        """Get a secret value from the appropriate source."""
        if self.environment == "production":
            try:
                response = self.client.get_secret_value(SecretId=self.aws_secret_name)
                secrets = json.loads(response["SecretString"])
                return secrets.get(key)
            except ClientError as e:
                if e.response["Error"]["Code"] == "ResourceNotFoundException":
                    return os.getenv(key)
                raise
        else:
            return os.getenv(key)

    def encrypt_value(self, value: str) -> str:
        """Encrypt a value using Fernet."""
        if not self.fernet:
            raise ValueError("Encryption key not set")
        return self.fernet.encrypt(value.encode()).decode()

    def decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a value using Fernet."""
        if not self.fernet:
            raise ValueError("Encryption key not set")
        return self.fernet.decrypt(encrypted_value.encode()).decode()

    def update_secret(self, key: str, value: str) -> None:
        """Update a secret in AWS Secrets Manager."""
        if self.environment != "production":
            return
            
        try:
            # Get existing secrets
            response = self.client.get_secret_value(SecretId=self.aws_secret_name)
            secrets = json.loads(response["SecretString"])
            
            # Update the specific secret
            secrets[key] = value
            
            # Put the updated secrets back
            self.client.put_secret_value(
                SecretId=self.aws_secret_name,
                SecretString=json.dumps(secrets)
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                # Create new secret if it doesn't exist
                self.client.create_secret(
                    Name=self.aws_secret_name,
                    SecretString=json.dumps({key: value})
                )
            else:
                raise

# Singleton instance
secrets_manager = SecretsManager() 