# 🤖 SmartGesture Hub

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-19.1+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An AI-powered smart home automation system that uses hand gesture recognition to control IoT devices. Built with MediaPipe, Machine Learning, and modern web technologies.

## 🌟 Features

### 🎯 **Core Functionality**
- **Real-time Hand Gesture Recognition** using MediaPipe and custom ML models
- **Smart Device Control** - Control lights, fans, TVs, and more with gestures
- **Dual Detection Modes** - Switch between landmark analysis and trained ML models
- **Live Camera Feed** with professional dashboard interface
- **Gesture Recording & Training** - Create custom gesture datasets
- **Model Training Pipeline** - Train RandomForest classifiers for custom gestures

### 🎨 **Modern UI/UX**
- **Professional Dashboard** with gradient designs and glass morphism effects
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Real-time Status Indicators** - Backend connectivity and AI model status
- **Interactive Controls** - Intuitive buttons and toggles
- **Live Gesture Display** - Visual feedback for detected gestures

### 🤖 **AI & Machine Learning**
- **MediaPipe Integration** - High-accuracy hand landmark detection
- **Custom ML Pipeline** - Train models on your own gesture data
- **Scikit-learn RandomForest** - Robust gesture classification
- **Data Management** - CSV-based dataset storage and management
- **Model Persistence** - Save and load trained models

## 🏗️ Project Structure

```
EPICS/
├── backend/                    # Flask API Server
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── gesture_dataset.csv    # Gesture training data
│   └── gesture_model.pkl      # Trained ML model
│
├── gesture-control-hub/       # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraFeed.tsx      # Live camera & detection
│   │   │   ├── GestureDisplay.tsx  # Gesture visualization
│   │   │   ├── DeviceCard.tsx      # Smart device controls
│   │   │   ├── GestureRecorder.tsx # Record training data
│   │   │   └── ModelTrainer.tsx    # Train ML models
│   │   ├── services/
│   │   │   └── api.ts             # API service layer
│   │   ├── App.tsx                # Main application
│   │   └── index.tsx              # Entry point
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Webcam** for gesture detection
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/Mayank4543/EPICS_AI.git
cd EPICS_AI
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd gesture-control-hub

# Install Node.js dependencies
npm install

# Start React development server
npm start
```

The frontend will open at `http://localhost:3000`

## 🎮 How to Use

### 1. **Device Control Mode** 🏠
- Access the main dashboard
- Ensure backend is connected (green status indicator)
- Enable your webcam
- Use these gestures to control devices:
  - **✋ Open Hand** - Turn off all lights
  - **👍 Thumbs Up** - Increase fan speed
  - **👎 Thumbs Down** - Decrease fan speed
  - **👉 Pointing** - Toggle TV power

### 2. **Record Gestures Mode** 📹
- Switch to "Record Gestures" tab
- Enter a gesture name
- Position your hand in the camera
- Click "Capture Gesture" to save training data
- Build a dataset with multiple samples per gesture

### 3. **Train Model Mode** 🤖
- Switch to "Train Model" tab
- Review your dataset statistics
- Click "Train Model" to create a custom ML classifier
- Once trained, toggle "AI Mode" for enhanced accuracy

## 🛠️ API Endpoints

### Health & Info
- `GET /health` - Backend health check
- `GET /model-info` - MediaPipe model information
- `GET /dataset-info` - Training dataset statistics

### Gesture Detection
- `POST /detect-gesture` - Landmark-based detection
- `POST /detect` - ML model-based detection

### Machine Learning
- `POST /record-gesture` - Record training samples
- `POST /train` - Train custom ML model

## 🎯 Supported Gestures

### Default Landmark-Based Gestures
| Gesture | Symbol | Action |
|---------|---------|--------|
| Open Hand | ✋ | Turn off all lights |
| Thumbs Up | 👍 | Increase fan speed |
| Thumbs Down | 👎 | Decrease fan speed |
| Pointing | 👉 | Toggle TV power |

### Custom ML Gestures
Train your own gestures for any action! The system supports unlimited custom gestures through the ML training pipeline.

## 🔧 Configuration

### Backend Configuration
Edit `backend/app.py` to modify:
- Detection confidence thresholds
- Model parameters
- Device endpoints
- CORS settings

### Frontend Configuration
Edit `gesture-control-hub/src/services/api.ts` to modify:
- API endpoints
- Timeout values
- Request configurations

## 🧪 Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd gesture-control-hub
npm install
npm start
```

### Building for Production
```bash
# Frontend
cd gesture-control-hub
npm run build

# Backend (with Gunicorn)
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe** - Google's machine learning framework for hand tracking
- **OpenCV** - Computer vision library
- **React** - Frontend framework
- **Flask** - Python web framework
- **Scikit-learn** - Machine learning library
- **TailwindCSS** - Utility-first CSS framework

## 📞 Support

For questions and support:
- Create an [Issue](https://github.com/Mayank4543/EPICS_AI/issues)
- Contact: [Mayank4543](https://github.com/Mayank4543)

## 🚧 Roadmap

- [ ] Mobile app support
- [ ] Voice command integration
- [ ] Cloud deployment guides
- [ ] More IoT device integrations
- [ ] Advanced gesture customization
- [ ] Real-time collaborative training

---

**Built with ❤️ by [Mayank4543](https://github.com/Mayank4543)**

*Smart homes made smarter with AI and gestures!*