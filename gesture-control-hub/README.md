# Gesture-Controlled Smart Home Hub

A modern web application that allows you to control your smart home devices using hand gestures through your webcam. This project demonstrates the integration of gesture recognition technology with smart home automation.

![Gesture Control Hub Screenshot](https://via.placeholder.com/800x400?text=Gesture+Control+Hub)

## Features

- **Gesture Recognition**: Control devices with simple hand gestures
- **Real-time Device Control**: Toggle lights, adjust fan speed, control TV
- **Responsive UI**: Beautiful interface that works on desktop and mobile
- **Mock API**: Simulated smart home backend for demonstration purposes

## Supported Gestures

- ✋ Open Palm: Turn OFF all lights
- 👍 Thumbs Up: Increase fan speed
- 👎 Thumbs Down: Decrease fan speed
- 👉 Pointing: Toggle TV power

## Getting Started

Follow these steps to run the application on your local machine:

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gesture-control-hub.git
   cd gesture-control-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Uploading to Your Repository

To upload this project to your GitHub repository:

1. Create a new repository on GitHub (if you don't have one already)

2. Initialize git in your project folder (if not already initialized):
   ```bash
   git init
   ```

3. Add all files to git:
   ```bash
   git add .
   ```

4. Commit the changes:
   ```bash
   git commit -m "Initial commit: Gesture Control Hub"
   ```

5. Add your remote repository:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   ```

6. Push to your repository:
   ```bash
   git push -u origin main
   ```
   (Use `master` instead of `main` if your default branch is named differently)

## Technology Stack

- React.js with TypeScript
- Tailwind CSS for styling
- React Webcam for camera access
- Axios for API communication

## Project Structure

- `/src/components`: UI components
- `/src/services`: API and backend communication
- `/public`: Static assets

## Future Enhancements

- Integration with real smart home APIs (HomeKit, Google Home, etc.)
- Additional gesture recognition capabilities
- User profiles and customizable gesture mappings
- Mobile app version

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app)
- Icons and design inspiration from various open-source projects
