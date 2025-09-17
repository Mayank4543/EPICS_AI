#!/usr/bin/env python3
"""
Flask Backend Server for Hand Gesture Recognition
Uses MediaPipe Hands for real-time hand landmark detection from base64 images.
"""

import os
import io
import base64
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

import cv2
import numpy as np
import mediapipe as mp
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Flask
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Data storage configuration
CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), 'gesture_data.csv')
MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), 'gesture_model.pkl')

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# Global MediaPipe Hands model
hands_model = None

def initialize_mediapipe_model():
    """Initialize the MediaPipe Hands model with optimal settings."""
    global hands_model
    try:
        logger.info("Initializing MediaPipe Hands model...")
        hands_model = mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        logger.info("✅ MediaPipe Hands model initialized successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize MediaPipe Hands model: {e}")
        return False

def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decode base64 image string to OpenCV image format.
    
    Args:
        base64_string: Base64 encoded image string (with or without data URL prefix)
        
    Returns:
        OpenCV image array or None if decoding fails
    """
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image/'):
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to PIL Image
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Convert PIL to OpenCV format (RGB to BGR)
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        return None

def process_hand_landmarks(results) -> List[Dict[str, Any]]:
    """
    Process MediaPipe hand landmarks results into structured format.
    
    Args:
        results: MediaPipe Hands results object
        
    Returns:
        List of hand detection results with landmarks and metadata
    """
    if not results.multi_hand_landmarks:
        return []
    
    processed_hands = []
    
    for hand_idx, (hand_landmarks, handedness) in enumerate(
        zip(results.multi_hand_landmarks, results.multi_handedness)
    ):
        # Extract landmark coordinates
        landmarks = []
        for idx, landmark in enumerate(hand_landmarks.landmark):
            landmarks.append({
                'index': idx,
                'name': get_landmark_name(idx),
                'x': round(landmark.x, 4),
                'y': round(landmark.y, 4),
                'z': round(landmark.z, 4),
                'visibility': round(landmark.visibility, 4) if hasattr(landmark, 'visibility') else 1.0
            })
        
        # Get handedness information
        hand_label = handedness.classification[0].label
        hand_confidence = handedness.classification[0].score
        
        processed_hands.append({
            'handIndex': hand_idx,
            'handedness': hand_label.lower(),  # 'left' or 'right'
            'confidence': round(hand_confidence, 4),
            'landmarks': landmarks,
            'totalLandmarks': len(landmarks)
        })
    
    return processed_hands

def get_landmark_name(index: int) -> str:
    """
    Get the name of a hand landmark by its index.
    
    Args:
        index: Landmark index (0-20)
        
    Returns:
        Human-readable landmark name
    """
    landmark_names = [
        'WRIST',
        'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
        'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
        'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
        'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
        'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
    ]
    
    return landmark_names[index] if index < len(landmark_names) else f'LANDMARK_{index}'

def initialize_csv_file():
    """Initialize CSV file with headers if it doesn't exist."""
    if not os.path.exists(CSV_FILE_PATH):
        headers = ['gesture_name']
        # Add coordinate columns for 21 landmarks (x0,y0,z0, x1,y1,z1, ..., x20,y20,z20)
        for i in range(21):
            headers.extend([f'x{i}', f'y{i}', f'z{i}'])
        
        df = pd.DataFrame(columns=headers)
        df.to_csv(CSV_FILE_PATH, index=False)
        logger.info(f"✅ Created CSV file: {CSV_FILE_PATH}")

def save_landmarks_to_csv(gesture_name: str, landmarks: List[Dict[str, Any]]) -> bool:
    """
    Save hand landmarks to CSV file.
    
    Args:
        gesture_name: Name of the gesture
        landmarks: List of landmark dictionaries from process_hand_landmarks
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Extract coordinates from landmarks (assuming first hand if multiple detected)
        if not landmarks:
            logger.error("No landmarks provided to save")
            return False
        
        first_hand = landmarks[0]['landmarks']
        if len(first_hand) != 21:
            logger.error(f"Expected 21 landmarks, got {len(first_hand)}")
            return False
        
        # Create data row
        row_data = {'gesture_name': gesture_name}
        for i, landmark in enumerate(first_hand):
            row_data[f'x{i}'] = landmark['x']
            row_data[f'y{i}'] = landmark['y']
            row_data[f'z{i}'] = landmark['z']
        
        # Append to CSV
        df = pd.DataFrame([row_data])
        if os.path.exists(CSV_FILE_PATH):
            df.to_csv(CSV_FILE_PATH, mode='a', header=False, index=False)
        else:
            initialize_csv_file()
            df.to_csv(CSV_FILE_PATH, mode='a', header=False, index=False)
        
        logger.info(f"✅ Saved landmarks for gesture '{gesture_name}' to CSV")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save landmarks to CSV: {e}")
        return False

def load_model() -> Optional[RandomForestClassifier]:
    """Load the trained gesture recognition model."""
    try:
        if os.path.exists(MODEL_FILE_PATH):
            model = joblib.load(MODEL_FILE_PATH)
            logger.info("✅ Loaded trained model")
            return model
        else:
            logger.warning("No trained model found")
            return None
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

def train_gesture_model() -> Dict[str, Any]:
    """
    Train a RandomForest classifier on the gesture data.
    
    Returns:
        Dictionary with training results and metrics
    """
    try:
        if not os.path.exists(CSV_FILE_PATH):
            return {
                'success': False,
                'message': 'No training data found. Please record some gestures first.'
            }
        
        # Load data
        df = pd.read_csv(CSV_FILE_PATH)
        if len(df) == 0:
            return {
                'success': False,
                'message': 'CSV file is empty. Please record some gestures first.'
            }
        
        # Check if we have enough data
        gesture_counts = df['gesture_name'].value_counts()
        if len(gesture_counts) < 2:
            return {
                'success': False,
                'message': 'Need at least 2 different gestures to train a model.'
            }
        
        min_samples = gesture_counts.min()
        total_samples = len(df)
        
        # Dynamic validation based on data size
        if min_samples < 2:
            return {
                'success': False,
                'message': f'Each gesture needs at least 2 samples. Found minimum: {min_samples}'
            }
        
        # Calculate appropriate test size to ensure each class has at least 1 sample in both sets
        # For stratified split to work, we need at least 2 samples per class
        min_test_samples = len(gesture_counts)  # At least 1 sample per class in test set
        
        if total_samples < min_test_samples * 2:
            return {
                'success': False,
                'message': f'Need at least {min_test_samples * 2} total samples for {len(gesture_counts)} gestures (currently have {total_samples})'
            }
        
        # Prepare features and labels
        X = df.drop('gesture_name', axis=1).values
        y = df['gesture_name'].values
        
        # Dynamic test size calculation
        if total_samples >= 50:
            test_size = 0.2  # 20% for larger datasets
        elif total_samples >= 30:
            test_size = 0.25  # 25% for medium datasets
        else:
            # For smaller datasets, ensure at least 1 sample per class in test set
            test_size = max(0.3, min_test_samples / total_samples)
        
        try:
            # Split data with stratification
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y
            )
        except ValueError as e:
            # If stratified split fails, use regular split
            logger.warning(f"Stratified split failed: {e}. Using regular split.")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
        
        # Train model with parameters suitable for small datasets
        model = RandomForestClassifier(
            n_estimators=min(100, max(10, total_samples * 2)),  # Scale trees with data size
            random_state=42,
            max_depth=min(10, max(3, total_samples // 5)),  # Prevent overfitting on small data
            min_samples_split=max(2, min(5, total_samples // 10)),  # Adaptive split threshold
            min_samples_leaf=1,  # Allow single sample leaves for small datasets
            bootstrap=True,
            class_weight='balanced'  # Handle imbalanced classes
        )
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Additional metrics for small datasets
        train_accuracy = model.score(X_train, y_train)
        
        # Save model
        joblib.dump(model, MODEL_FILE_PATH)
        
        return {
            'success': True,
            'message': 'Model trained successfully',
            'accuracy': round(accuracy, 4),
            'train_accuracy': round(train_accuracy, 4),
            'totalSamples': len(df),
            'gestureCount': len(gesture_counts),
            'gestures': gesture_counts.to_dict(),
            'trainingSamples': len(X_train),
            'testingSamples': len(X_test),
            'testSize': round(test_size, 3),
            'modelParams': {
                'n_estimators': model.n_estimators,
                'max_depth': model.max_depth,
                'min_samples_split': model.min_samples_split
            }
        }
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        return {
            'success': False,
            'message': f'Training failed: {str(e)}'
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'modelLoaded': hands_model is not None,
        'service': 'Hand Gesture Recognition API',
        'version': '1.0.0'
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model."""
    return jsonify({
        'modelLoaded': hands_model is not None,
        'modelType': 'MediaPipe Hands',
        'version': mp.__version__,
        'description': 'MediaPipe Hands for real-time hand landmark detection',
        'maxHands': 2,
        'landmarks': 21,
        'inputFormat': 'base64-encoded image (data:image/...)',
        'maxImageSize': '50MB',
        'detectionConfidence': 0.7,
        'trackingConfidence': 0.5
    })

@app.route('/detect-gesture', methods=['POST'])
def detect_gesture():
    """
    Main gesture detection endpoint.
    Accepts base64-encoded images and returns hand landmarks.
    """
    try:
        # Check if model is loaded
        if hands_model is None:
            return jsonify({
                'error': 'Model not loaded',
                'message': 'MediaPipe Hands model is not initialized. Please try again later.'
            }), 503
        
        # Validate request
        if not request.is_json:
            return jsonify({
                'error': 'Invalid content type',
                'message': 'Request must be JSON with application/json content type.'
            }), 400
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'error': 'Missing image data',
                'message': 'Please provide a base64-encoded image in the request body.'
            }), 400
        
        base64_image = data['image']
        
        # Validate base64 format
        if not isinstance(base64_image, str):
            return jsonify({
                'error': 'Invalid image format',
                'message': 'Image must be a base64-encoded string.'
            }), 400
        
        logger.info("Processing gesture detection request...")
        
        # Decode base64 image
        image = decode_base64_image(base64_image)
        if image is None:
            return jsonify({
                'error': 'Image decoding failed',
                'message': 'Unable to decode the provided base64 image. Please ensure it\'s a valid image format.'
            }), 400
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run hand detection
        try:
            logger.info("Running MediaPipe hand detection...")
            results = hands_model.process(rgb_image)
            logger.info(f"✅ Detection complete. Found {len(results.multi_hand_landmarks) if results.multi_hand_landmarks else 0} hand(s)")
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
            return jsonify({
                'error': 'Detection failed',
                'message': 'An error occurred during hand detection processing.'
            }), 500
        
        # Process results
        if not results.multi_hand_landmarks:
            return jsonify({
                'success': True,
                'handsDetected': 0,
                'message': 'No hands detected in the image',
                'predictions': [],
                'timestamp': datetime.now().isoformat()
            })
        
        # Format response
        processed_hands = process_hand_landmarks(results)
        
        response_data = {
            'success': True,
            'handsDetected': len(processed_hands),
            'predictions': processed_hands,
            'timestamp': datetime.now().isoformat(),
            'processingInfo': {
                'modelType': 'MediaPipe Hands',
                'modelVersion': mp.__version__,
                'imageSize': {
                    'width': image.shape[1],
                    'height': image.shape[0]
                }
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Unexpected error in detect_gesture: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while processing the request.',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/record-gesture', methods=['POST'])
def record_gesture():
    """
    Record a gesture by extracting landmarks and saving to CSV.
    Accepts gesture_name and base64 image.
    """
    try:
        # Check if model is loaded
        if hands_model is None:
            return jsonify({
                'error': 'Model not loaded',
                'message': 'MediaPipe Hands model is not initialized. Please try again later.'
            }), 503
        
        # Validate request
        if not request.is_json:
            return jsonify({
                'error': 'Invalid content type',
                'message': 'Request must be JSON with application/json content type.'
            }), 400
        
        data = request.get_json()
        if not data or 'gesture_name' not in data or 'image' not in data:
            return jsonify({
                'error': 'Missing required data',
                'message': 'Please provide both gesture_name and base64-encoded image in the request body.'
            }), 400
        
        gesture_name = data['gesture_name']
        base64_image = data['image']
        
        # Validate inputs
        if not isinstance(gesture_name, str) or not gesture_name.strip():
            return jsonify({
                'error': 'Invalid gesture name',
                'message': 'Gesture name must be a non-empty string.'
            }), 400
        
        if not isinstance(base64_image, str):
            return jsonify({
                'error': 'Invalid image format',
                'message': 'Image must be a base64-encoded string.'
            }), 400
        
        gesture_name = gesture_name.strip()
        logger.info(f"Recording gesture: {gesture_name}")
        
        # Decode base64 image
        image = decode_base64_image(base64_image)
        if image is None:
            return jsonify({
                'error': 'Image decoding failed',
                'message': 'Unable to decode the provided base64 image. Please ensure it\'s a valid image format.'
            }), 400
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run hand detection
        try:
            logger.info("Running MediaPipe hand detection for recording...")
            results = hands_model.process(rgb_image)
            logger.info(f"Detection complete. Found {len(results.multi_hand_landmarks) if results.multi_hand_landmarks else 0} hand(s)")
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
            return jsonify({
                'error': 'Detection failed',
                'message': 'An error occurred during hand detection processing.'
            }), 500
        
        # Check if hands were detected
        if not results.multi_hand_landmarks:
            return jsonify({
                'success': False,
                'message': 'No hands detected in the image. Please ensure your hand is clearly visible.',
                'gesture_name': gesture_name,
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Process landmarks
        processed_hands = process_hand_landmarks(results)
        
        # Save to CSV
        if save_landmarks_to_csv(gesture_name, processed_hands):
            # Get updated dataset info
            dataset_info = {}
            if os.path.exists(CSV_FILE_PATH):
                df = pd.read_csv(CSV_FILE_PATH)
                dataset_info = {
                    'totalSamples': len(df),
                    'gestures': df['gesture_name'].value_counts().to_dict()
                }
            
            return jsonify({
                'success': True,
                'message': f'Gesture "{gesture_name}" recorded successfully',
                'gesture_name': gesture_name,
                'handsDetected': len(processed_hands),
                'landmarksSaved': True,
                'dataset': dataset_info,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': 'Failed to save data',
                'message': 'Could not save landmark data to CSV file.',
                'timestamp': datetime.now().isoformat()
            }), 500
        
    except Exception as e:
        logger.error(f"Unexpected error in record_gesture: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while recording the gesture.',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """
    Train the gesture recognition model using recorded data.
    """
    try:
        logger.info("Starting model training...")
        
        # Initialize CSV if it doesn't exist
        initialize_csv_file()
        
        # Train the model
        result = train_gesture_model()
        
        if result['success']:
            logger.info("✅ Model training completed successfully")
            return jsonify({
                **result,
                'timestamp': datetime.now().isoformat(),
                'modelPath': MODEL_FILE_PATH
            })
        else:
            logger.warning(f"Training failed: {result['message']}")
            return jsonify({
                **result,
                'timestamp': datetime.now().isoformat()
            }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in train_model: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred during model training.',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/detect', methods=['POST'])
def detect_trained_gesture():
    """
    Detect gesture using the trained model.
    Accepts base64 image and returns predicted gesture name.
    """
    try:
        # Check if MediaPipe model is loaded
        if hands_model is None:
            return jsonify({
                'error': 'MediaPipe model not loaded',
                'message': 'MediaPipe Hands model is not initialized. Please try again later.'
            }), 503
        
        # Load trained model
        model = load_model()
        if model is None:
            return jsonify({
                'error': 'No trained model',
                'message': 'No trained model found. Please train a model first using the /train endpoint.'
            }), 404
        
        # Validate request
        if not request.is_json:
            return jsonify({
                'error': 'Invalid content type',
                'message': 'Request must be JSON with application/json content type.'
            }), 400
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'error': 'Missing image data',
                'message': 'Please provide a base64-encoded image in the request body.'
            }), 400
        
        base64_image = data['image']
        
        # Validate base64 format
        if not isinstance(base64_image, str):
            return jsonify({
                'error': 'Invalid image format',
                'message': 'Image must be a base64-encoded string.'
            }), 400
        
        logger.info("Processing gesture detection with trained model...")
        
        # Decode base64 image
        image = decode_base64_image(base64_image)
        if image is None:
            return jsonify({
                'error': 'Image decoding failed',
                'message': 'Unable to decode the provided base64 image. Please ensure it\'s a valid image format.'
            }), 400
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run hand detection
        try:
            logger.info("Running MediaPipe hand detection for prediction...")
            results = hands_model.process(rgb_image)
            logger.info(f"Detection complete. Found {len(results.multi_hand_landmarks) if results.multi_hand_landmarks else 0} hand(s)")
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
            return jsonify({
                'error': 'Detection failed',
                'message': 'An error occurred during hand detection processing.'
            }), 500
        
        # Check if hands were detected
        if not results.multi_hand_landmarks:
            return jsonify({
                'success': False,
                'message': 'No hands detected in the image. Please ensure your hand is clearly visible.',
                'predicted_gesture': None,
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            })
        
        # Process landmarks
        processed_hands = process_hand_landmarks(results)
        
        # Extract features for prediction (using first hand)
        if not processed_hands:
            return jsonify({
                'success': False,
                'message': 'Could not extract hand landmarks.',
                'predicted_gesture': None,
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            })
        
        first_hand = processed_hands[0]['landmarks']
        if len(first_hand) != 21:
            return jsonify({
                'success': False,
                'message': f'Expected 21 landmarks, got {len(first_hand)}.',
                'predicted_gesture': None,
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            })
        
        # Prepare feature vector
        features = []
        for landmark in first_hand:
            features.extend([landmark['x'], landmark['y'], landmark['z']])
        
        # Predict gesture
        prediction = model.predict([features])[0]
        prediction_proba = model.predict_proba([features])[0]
        confidence = max(prediction_proba)
        
        # Get class probabilities
        classes = model.classes_
        probabilities = dict(zip(classes, prediction_proba))
        
        logger.info(f"✅ Predicted gesture: {prediction} (confidence: {confidence:.4f})")
        
        return jsonify({
            'success': True,
            'predicted_gesture': prediction,
            'confidence': round(confidence, 4),
            'all_probabilities': {k: round(v, 4) for k, v in probabilities.items()},
            'handsDetected': len(processed_hands),
            'handedness': processed_hands[0]['handedness'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in detect_trained_gesture: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred during gesture detection.',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/dataset-info', methods=['GET'])
def dataset_info():
    """Get information about the recorded dataset."""
    try:
        if not os.path.exists(CSV_FILE_PATH):
            return jsonify({
                'exists': False,
                'message': 'No dataset found. Start recording gestures first.',
                'totalSamples': 0,
                'gestures': {},
                'timestamp': datetime.now().isoformat()
            })
        
        df = pd.read_csv(CSV_FILE_PATH)
        gesture_counts = df['gesture_name'].value_counts()
        
        return jsonify({
            'exists': True,
            'totalSamples': len(df),
            'gestureCount': len(gesture_counts),
            'gestures': gesture_counts.to_dict(),
            'filePath': CSV_FILE_PATH,
            'modelExists': os.path.exists(MODEL_FILE_PATH),
            'modelPath': MODEL_FILE_PATH if os.path.exists(MODEL_FILE_PATH) else None,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting dataset info: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Could not retrieve dataset information.',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(413)
def file_too_large(error):
    """Handle file too large errors."""
    return jsonify({
        'error': 'File too large',
        'message': 'The uploaded image is too large. Maximum size is 50MB.',
        'timestamp': datetime.now().isoformat()
    }), 413

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint was not found.',
        'availableEndpoints': [
            'GET /health',
            'GET /model-info',
            'GET /dataset-info',
            'POST /detect-gesture',
            'POST /record-gesture',
            'POST /train',
            'POST /detect'
        ],
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_server_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred on the server.',
        'timestamp': datetime.now().isoformat()
    }), 500

def main():
    """Main function to start the Flask server."""
    print("🚀 ======================================")
    print("🚀 Hand Gesture Recognition API Server")
    print("🚀 Backend: Flask + MediaPipe")
    print("🚀 ======================================")
    
    # Initialize MediaPipe model
    if not initialize_mediapipe_model():
        logger.error("Failed to initialize MediaPipe model. Exiting...")
        return 1
    
    # Initialize CSV file for data storage
    initialize_csv_file()
    
    # Get configuration
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Host: {host}")
    print(f"🚀 Port: {port}")
    print(f"🚀 Debug: {debug}")
    print(f"🚀 Health Check: http://{host}:{port}/health")
    print(f"🚀 Model Info: http://{host}:{port}/model-info")
    print(f"🚀 Dataset Info: http://{host}:{port}/dataset-info")
    print(f"🚀 Record Gesture: POST http://{host}:{port}/record-gesture")
    print(f"🚀 Train Model: POST http://{host}:{port}/train")
    print(f"🚀 Detect Gesture: POST http://{host}:{port}/detect")
    print(f"🚀 Legacy Detection: POST http://{host}:{port}/detect-gesture")
    print("🚀 ======================================")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("Server shutdown requested by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())