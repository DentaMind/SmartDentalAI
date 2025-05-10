from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM
from typing import Dict

def get_diagnosis_model() -> Sequential:
    """Create the diagnosis model architecture."""
    model = Sequential([
        Dense(128, activation='relu', input_shape=(50,)),  # Example input shape
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(10, activation='softmax')  # Example output classes
    ])
    return model

def get_treatment_model() -> Sequential:
    """Create the treatment model architecture."""
    model = Sequential([
        LSTM(64, input_shape=(10, 50)),  # Example sequence input
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dense(16, activation='relu'),
        Dense(5, activation='softmax')  # Example output classes
    ])
    return model

def get_billing_model() -> Sequential:
    """Create the billing model architecture."""
    model = Sequential([
        Dense(64, activation='relu', input_shape=(30,)),  # Example input shape
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(16, activation='relu'),
        Dense(1, activation='linear')  # Regression output
    ])
    return model

# Model architecture factory
MODEL_ARCHITECTURES: Dict = {
    'diagnosis': get_diagnosis_model,
    'treatment': get_treatment_model,
    'billing': get_billing_model
}

def get_model_architecture(model_type: str) -> Sequential:
    """Get the appropriate model architecture based on type."""
    if model_type not in MODEL_ARCHITECTURES:
        raise ValueError(f"Unknown model type: {model_type}")
    return MODEL_ARCHITECTURES[model_type]() 