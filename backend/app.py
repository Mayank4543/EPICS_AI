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
            'POST /detect-gesture'
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
    
    # Get configuration
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Host: {host}")
    print(f"🚀 Port: {port}")
    print(f"🚀 Debug: {debug}")
    print(f"🚀 Health Check: http://{host}:{port}/health")
    print(f"🚀 Model Info: http://{host}:{port}/model-info")
    print(f"🚀 Gesture Detection: POST http://{host}:{port}/detect-gesture")
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