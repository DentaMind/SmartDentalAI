import logging
from typing import Dict, Any, Optional, Tuple
import numpy as np
from sklearn.model_selection import train_test_split
import os
from datetime import datetime
import json
from app.models.retraining import RetrainingConfig, ModelPerformance
from app.ml.models import get_model_architecture
from app.services.canary_deployment import CanaryDeploymentService

logger = logging.getLogger(__name__)

class ModelTrainer:
    def __init__(self):
        self.models_dir = "models"
        self.canary_service = CanaryDeploymentService()
        
        # Ensure models directory exists
        os.makedirs(self.models_dir, exist_ok=True)
        
    def _generate_version(self) -> str:
        """Generate a unique version string for a model."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"v{timestamp}"
        
    def _get_model_path(self, model_type: str, version: str) -> str:
        """Get the full path for a model version."""
        return os.path.join(self.models_dir, f"{model_type}_{version}.h5")
        
    def _get_metadata_path(self, model_type: str, version: str) -> str:
        """Get the full path for a model's metadata."""
        return os.path.join(self.models_dir, f"{model_type}_{version}_metadata.json")
        
    def _save_metadata(self, model_type: str, version: str, metadata: Dict[str, Any]) -> None:
        """Save model metadata to a JSON file."""
        path = self._get_metadata_path(model_type, version)
        with open(path, 'w') as f:
            json.dump(metadata, f, indent=2)
            
    def _load_metadata(self, model_type: str, version: str) -> Optional[Dict[str, Any]]:
        """Load model metadata from JSON file."""
        path = self._get_metadata_path(model_type, version)
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return None
        
    async def train(
        self,
        model_type: str,
        data: Dict[str, Any],
        config: RetrainingConfig
    ) -> ModelPerformance:
        """Train a model with the provided data and configuration."""
        try:
            logger.info(f"Starting training for {model_type} model")
            
            # Generate new version
            version = self._generate_version()
            
            # Prepare data
            X = data["features"]
            y = data["labels"]
            
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y,
                test_size=config.validation_split,
                random_state=42
            )
            
            # Get model architecture
            model = get_model_architecture(model_type)
            
            # Configure optimizer and learning rate
            model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Train model
            history = model.fit(
                X_train, y_train,
                epochs=config.epochs,
                batch_size=config.batch_size,
                validation_data=(X_val, y_val),
                verbose=1
            )
            
            # Evaluate on validation set
            val_loss, val_accuracy = model.evaluate(X_val, y_val, verbose=0)
            
            # Save model and metadata
            model_path = self._get_model_path(model_type, version)
            model.save(model_path)
            
            metadata = {
                "version": version,
                "created_at": datetime.utcnow().isoformat(),
                "config": config.dict(),
                "training_history": {
                    "loss": history.history["loss"],
                    "val_loss": history.history["val_loss"],
                    "accuracy": history.history["accuracy"],
                    "val_accuracy": history.history["val_accuracy"]
                },
                "performance": {
                    "validation_loss": float(val_loss),
                    "validation_accuracy": float(val_accuracy)
                },
                "data_stats": {
                    "training_samples": len(X_train),
                    "validation_samples": len(X_val)
                }
            }
            
            self._save_metadata(model_type, version, metadata)
            logger.info(f"Model saved to {model_path}")
            
            # Start canary deployment
            await self.canary_service.start_canary(
                model_type=model_type,
                model_version=version
            )
            
            # Return performance metrics
            return ModelPerformance(
                accuracy=float(val_accuracy),
                validation_loss=float(val_loss)
            )
            
        except Exception as e:
            logger.error(f"Training failed for {model_type}: {str(e)}")
            raise
            
    def load_model(self, model_type: str, version: Optional[str] = None) -> Tuple[Any, Dict[str, Any]]:
        """Load a model and its metadata. If version is None, loads the latest version."""
        try:
            if version is None:
                # Find latest version
                files = os.listdir(self.models_dir)
                versions = [f.split('_')[1].split('.')[0] for f in files if f.startswith(f"{model_type}_v") and f.endswith('.h5')]
                if not versions:
                    raise ValueError(f"No models found for type {model_type}")
                version = sorted(versions)[-1]
            
            model_path = self._get_model_path(model_type, version)
            if not os.path.exists(model_path):
                raise ValueError(f"Model not found: {model_path}")
                
            # Load model
            model = get_model_architecture(model_type)
            model.load_weights(model_path)
            
            # Load metadata
            metadata = self._load_metadata(model_type, version)
            if not metadata:
                metadata = {
                    "version": version,
                    "created_at": "unknown",
                    "performance": {}
                }
                
            return model, metadata
            
        except Exception as e:
            logger.error(f"Error loading model {model_type} version {version}: {str(e)}")
            raise
            
    async def get_serving_version(self, model_type: str) -> str:
        """Get the version of model that should be used for serving predictions."""
        try:
            # Check if there's an active canary
            canary_version = await self.canary_service.should_use_canary(model_type)
            if canary_version:
                return canary_version
                
            # Otherwise use latest promoted version
            files = os.listdir(self.models_dir)
            versions = [f.split('_')[1].split('.')[0] for f in files if f.startswith(f"{model_type}_v") and f.endswith('.h5')]
            if not versions:
                raise ValueError(f"No models found for type {model_type}")
                
            return sorted(versions)[-1]
            
        except Exception as e:
            logger.error(f"Error getting serving version for {model_type}: {str(e)}")
            raise 