# AI Model Deployment Guide

This document provides instructions for deploying real AI models in the DentaMind platform. By following these steps, you can transition from using mock data to actual AI inference for dental diagnostics and treatment suggestions.

## Table of Contents

1. [Requirements](#requirements)
2. [Model Formats and Placement](#model-formats-and-placement)
3. [Configuration](#configuration)
4. [Performance Considerations](#performance-considerations)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

## Requirements

Before deploying real AI models, ensure your environment meets the following requirements:

- **Minimum Hardware**:
  - CPU: 4+ cores (8+ recommended for production)
  - RAM: 8GB minimum (16GB+ recommended)
  - Disk: 20GB+ available space for models and dependencies
  - GPU: Optional but recommended for PyTorch/TensorFlow models

- **Required Dependencies**:
  For ONNX models:
  ```bash
  pip install onnxruntime
  ```

  For PyTorch models:
  ```bash
  pip install torch torchvision
  ```

  For TensorFlow models:
  ```bash
  pip install tensorflow
  ```

  For image processing (required for all model types):
  ```bash
  pip install opencv-python pillow
  ```

## Model Formats and Placement

The system supports the following model formats:

1. **ONNX** (Recommended for deployment simplicity and cross-platform compatibility)
2. **PyTorch** (Serialized TorchScript models)
3. **TensorFlow** (SavedModel format)
4. **API-based** (Roboflow, OpenAI Vision)

### Model Directory Structure

Place your models in the following directory structure:

```
models/
├── xray/
│   ├── dental_xray_detection.onnx   # ONNX model
│   ├── dental_xray_detection.pt     # PyTorch model
│   └── dental_xray_detection/       # TensorFlow SavedModel directory
├── treatment/
│   ├── treatment_suggestion.onnx    # ONNX model
│   ├── treatment_suggestion.pt      # PyTorch model
│   └── treatment_suggestion/        # TensorFlow SavedModel directory
└── version.json                    # Version information
```

### Version Information

Create a `version.json` file in the models directory with the following format:

```json
{
  "version": "1.0.0",
  "last_updated": "2025-05-01",
  "model_info": {
    "xray": {
      "type": "onnx",
      "version": "1.0.0",
      "description": "Dental X-ray analysis model for caries and periapical lesions"
    },
    "treatment": {
      "type": "onnx",
      "version": "1.0.0",
      "description": "Treatment suggestion model based on diagnostic findings"
    }
  }
}
```

## Configuration

### Environment Variables

Configure the following environment variables:

```bash
# General settings
USE_MOCK_AI=false                     # Set to false to use real models
FORCE_MODEL_TYPE=onnx                 # Optional: force a specific model type (onnx, pytorch, tensorflow, roboflow, openai)

# API keys for external services (if used)
ROBOFLOW_API_KEY=your_api_key_here    # Only needed if using Roboflow
OPENAI_API_KEY=your_api_key_here      # Only needed if using OpenAI
```

### Production Configuration

For production deployments, update the `.env.production` file:

```bash
USE_MOCK_AI=false
MODEL_CACHE_SIZE=5   # Number of models to keep in memory
```

### Docker Deployment

When deploying with Docker, ensure your Dockerfile includes the necessary dependencies:

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Add ONNX Runtime for CPU (or GPU version if needed)
RUN pip install --no-cache-dir onnxruntime

# Copy application code
COPY . .

# Set environment variables
ENV USE_MOCK_AI=false
ENV FORCE_MODEL_TYPE=onnx

# Run the application
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Performance Considerations

### Model Optimization

For optimal performance, consider:

1. **Quantization**: Convert models to INT8 precision to reduce memory footprint and improve inference speed.
2. **Pruning**: Remove unnecessary weights in neural networks.
3. **Caching**: The system already includes caching of inference results.

### Hardware Acceleration

For PyTorch or TensorFlow models, configure hardware acceleration:

```python
# For PyTorch GPU acceleration
import torch
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# For TensorFlow GPU acceleration
import tensorflow as tf
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    tf.config.experimental.set_memory_growth(gpus[0], True)
```

## Monitoring and Maintenance

### Model Performance Monitoring

The system logs all inference operations to the audit log database. Use the AI Performance Dashboard to:

1. Monitor inference latency
2. Track success rates
3. Review confidence scores
4. Analyze provider feedback

### Model Updates

When updating models:

1. Place new models in the appropriate directories
2. Update `version.json` with new version information
3. Restart the application or trigger a model reload via the admin interface
4. Verify proper operation through the health endpoint

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Make sure all dependencies are installed, particularly for your chosen model format.

2. **CUDA errors**: If using GPU acceleration, ensure your CUDA and cuDNN versions are compatible with your ML framework.

3. **Memory issues**: Large models may exceed memory limits. Consider:
   - Using smaller or quantized models
   - Increasing container memory limits
   - Implementing model unloading when idle

4. **Slow inference**: Check for bottlenecks:
   - Use profiling tools to identify slow operations
   - Ensure proper hardware acceleration is enabled
   - Consider batching inference requests

### Reverting to Mock Data

If you encounter issues with real models, you can temporarily revert to mock data:

1. Set `USE_MOCK_AI=true` in your environment
2. Restart the application

## Conclusion

With proper model deployment and configuration, the DentaMind platform provides powerful AI-assisted dental diagnostics and treatment suggestions. The system's flexible architecture accommodates various model formats and gracefully falls back to mock data when needed, ensuring high availability and reliability. 