import logging
import sys
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure logging
def setup_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )

    # File handler with rotation
    file_handler = RotatingFileHandler(
        f'logs/app_{datetime.now().strftime("%Y%m%d")}.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)

    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# Create error logger
error_logger = setup_logger('error')
error_logger.setLevel(logging.ERROR)

# Create access logger
access_logger = setup_logger('access')
access_logger.setLevel(logging.INFO)

# Create metrics logger
metrics_logger = setup_logger('metrics')
metrics_logger.setLevel(logging.INFO) 