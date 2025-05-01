#!/usr/bin/env python3
"""
Dependency Fixer Script for DentaMind
Handles compatibility issues between FastAPI and Pydantic versions
"""

import os
import sys
import subprocess
import pkg_resources
import logging
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Required versions for compatibility
REQUIREMENTS = {
    'fastapi': '0.88.0',
    'pydantic': '1.10.8',
    'starlette': '0.22.0',
    'uvicorn': '0.15.0',
    'python-multipart': '0.0.5',
    'python-jose': '3.3.0',
    'passlib': '1.7.4',
    'bcrypt': '3.2.0',
    'httpx': '0.23.0'
}

def check_environment():
    """Check if running in a virtual environment"""
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        logger.error("Not running in a virtual environment!")
        logger.info("Please activate your virtual environment first:")
        logger.info("  source .venv/bin/activate (Unix/macOS)")
        logger.info("  .venv\\Scripts\\activate (Windows)")
        return False
    return True

def get_installed_versions():
    """Get currently installed versions of our required packages"""
    installed = {}
    for pkg in REQUIREMENTS.keys():
        try:
            installed[pkg] = pkg_resources.get_distribution(pkg).version
        except pkg_resources.DistributionNotFound:
            installed[pkg] = None
    return installed

def install_requirements():
    """Install required package versions"""
    command = [sys.executable, "-m", "pip", "install"]
    packages = [f"{pkg}=={ver}" for pkg, ver in REQUIREMENTS.items()]
    command.extend(packages)
    
    logger.info("Installing required packages...")
    logger.info(" ".join(command))
    
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Failed to install packages: {result.stderr}")
            return False
        logger.info("Packages installed successfully")
        return True
    except Exception as e:
        logger.error(f"Exception during package installation: {e}")
        return False

def clear_cache():
    """Clear Python cache files to avoid import issues"""
    logger.info("Clearing Python cache files...")
    
    # Walk through the backend directory and remove __pycache__ directories
    for root, dirs, files in os.walk('backend'):
        if '__pycache__' in dirs:
            cache_dir = os.path.join(root, '__pycache__')
            logger.info(f"Removing {cache_dir}")
            try:
                shutil.rmtree(cache_dir)
            except Exception as e:
                logger.error(f"Failed to remove {cache_dir}: {e}")
    
    logger.info("Cache files cleared")
    return True

def check_imports():
    """Test importing the key modules"""
    logger.info("Testing imports...")
    try:
        import fastapi
        import pydantic
        import starlette
        
        logger.info(f"FastAPI version: {fastapi.__version__}")
        logger.info(f"Pydantic version: {pydantic.__version__}")
        logger.info(f"Starlette version: {starlette.__version__}")
        
        # Test that Pydantic works with our version
        from pydantic import BaseModel
        
        class TestModel(BaseModel):
            name: str
            value: int
            is_active: bool = True
            
        test = TestModel(name="Test", value=42)
        logger.info(f"Pydantic model test: {test.dict()}")
        
        return True
    except ImportError as e:
        logger.error(f"Import error: {e}")
        return False
    except Exception as e:
        logger.error(f"Error during import test: {e}")
        return False

def update_requirements_file():
    """Update requirements.txt with correct versions"""
    logger.info("Updating requirements.txt file...")
    
    # Read existing requirements.txt
    req_lines = []
    try:
        with open('requirements.txt', 'r') as f:
            req_lines = f.readlines()
    except FileNotFoundError:
        req_lines = []
    
    # Keep lines that don't match our managed packages
    updated_lines = []
    for line in req_lines:
        package = line.split('==')[0].strip() if '==' in line else line.strip()
        if package not in REQUIREMENTS:
            updated_lines.append(line)
    
    # Add our package requirements
    for pkg, ver in REQUIREMENTS.items():
        updated_lines.append(f"{pkg}=={ver}\n")
    
    # Write updated requirements.txt
    with open('requirements.txt', 'w') as f:
        f.writelines(updated_lines)
    
    logger.info("requirements.txt updated")
    return True

def main():
    """Main execution function"""
    if not check_environment():
        return False
    
    installed = get_installed_versions()
    logger.info("Currently installed packages:")
    for pkg, ver in installed.items():
        if ver:
            status = "✅" if ver == REQUIREMENTS[pkg] else "❌"
            logger.info(f"{status} {pkg}: {ver} (required: {REQUIREMENTS[pkg]})")
        else:
            logger.info(f"❌ {pkg}: Not installed (required: {REQUIREMENTS[pkg]})")
    
    # Check if any packages need installation/upgrade
    needs_install = False
    for pkg, ver in REQUIREMENTS.items():
        if installed.get(pkg) != ver:
            needs_install = True
            break
    
    if needs_install:
        if not install_requirements():
            return False
    else:
        logger.info("All required packages are already at the correct versions")
    
    # Update requirements.txt
    update_requirements_file()
    
    # Clear cache to avoid import errors
    clear_cache()
    
    # Verify imports
    if not check_imports():
        logger.error("Import verification failed!")
        return False
    
    logger.info("Dependency compatibility fix completed successfully")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 