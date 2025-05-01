#!/bin/bash
# Dental Imaging Analysis Setup Script
# This script prepares the environment for dental imaging analysis

# Print header
echo "======================================================"
echo "       DentaMind Dental Imaging Analysis Setup        "
echo "======================================================"
echo

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1)
if [[ $python_version == *"Python 3"* ]]; then
    echo -e "${GREEN}✓ Python 3 found: $python_version${NC}"
else
    echo -e "${RED}✗ Python 3 not found or not in PATH.${NC}"
    echo "Please install Python 3.7 or higher."
    exit 1
fi

# Create or activate virtual environment
echo -e "\n${YELLOW}Setting up virtual environment...${NC}"
if [ -d "venv" ]; then
    echo "Virtual environment already exists."
    echo "Activating existing environment..."
    source venv/bin/activate
else
    echo "Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
fi

# Install required Python packages
echo -e "\n${YELLOW}Installing required Python packages...${NC}"
pip install --upgrade pip
pip install requests tabulate numpy pillow

# Check debug server port
echo -e "\n${YELLOW}Checking if debug server port is available...${NC}"
if nc -z localhost 8092 2>/dev/null; then
    echo -e "${RED}✗ Port 8092 is already in use.${NC}"
    echo "This might interfere with the debug server."
    echo "You can check what's using the port with: lsof -i :8092"
else
    echo -e "${GREEN}✓ Port 8092 is available.${NC}"
fi

# Create directory structure
echo -e "\n${YELLOW}Creating directory structure for dental images...${NC}"
python3 dental_imaging_analyzer.py --setup-only
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Directory structure created successfully.${NC}"
else
    echo -e "${RED}✗ Failed to create directory structure.${NC}"
    exit 1
fi

# Download sample images if requested
echo -e "\n${YELLOW}Would you like to download sample dental X-ray images? (y/n)${NC}"
read -r download_images
if [[ $download_images == "y" ]]; then
    echo "Downloading sample images..."
    mkdir -p imaging_test/fmx
    mkdir -p imaging_test/panoramic
    mkdir -p imaging_test/cbct
    
    # Download panoramic
    curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Panoramic_dental_x-ray.JPG/1200px-Panoramic_dental_x-ray.JPG" -o imaging_test/panoramic/sample_pano.jpg
    
    # Create sample FMX filenames
    echo "Creating sample filename structure for FMX series..."
    for tooth in 2 3 14 15 18 19 30 31; do
        echo "You would need to add: PA_${tooth}.jpg to imaging_test/fmx/"
    done
    for region in UL UR LL LR; do
        echo "You would need to add: BW_${region}.jpg to imaging_test/fmx/"
    done
fi

# Start debug server if requested
echo -e "\n${YELLOW}Would you like to start the debug server now? (y/n)${NC}"
read -r start_server
if [[ $start_server == "y" ]]; then
    echo "Starting debug server on port 8092..."
    python3 debug_routes_alt.py &
    
    # Check if server started
    sleep 3
    if nc -z localhost 8092 2>/dev/null; then
        echo -e "${GREEN}✓ Debug server started successfully on port 8092.${NC}"
    else
        echo -e "${RED}✗ Failed to start debug server.${NC}"
        echo "Check error logs for details."
    fi
fi

# Print usage information
echo -e "\n${GREEN}======== Setup Complete ========${NC}"
echo "Usage instructions:"
echo "1. Add dental X-ray images to the imaging_test directory"
echo "2. Make sure the debug server is running on port 8092"
echo "3. Run analysis with: python3 dental_imaging_analyzer.py"
echo
echo "Individual analyzers:"
echo "- FMX Clinical: python3 clinical_analyzer.py"
echo "- Panoramic: python3 panoramic_analyzer.py"
echo "- CBCT: python3 cbct_analyzer.py"
echo
echo "For more options, run any script with --help"
echo -e "${GREEN}=================================${NC}" 