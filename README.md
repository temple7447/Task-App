# TaskMaster - Personal Task Management App 📝

A modern React Native task management application built with Expo, designed to help you organize, track, and complete your tasks efficiently.

![TaskMaster](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue) ![React Native](https://img.shields.io/badge/React%20Native-0.81-green) ![Expo](https://img.shields.io/badge/Expo-~54.0-black)

## 🚀 Features

### 📱 **Onboarding Experience**
- Beautiful multi-step welcome screens
- Interactive introduction to app features
- First-time user guidance

### ✅ **Task Management**
- **Create Tasks**: Add tasks with titles, descriptions, dates, and locations
- **Status Tracking**: Mark tasks as pending, in progress, completed, or cancelled
- **Smart Organization**: Sort by date added, status, or due date
- **Advanced Filtering**: Filter tasks by status or search by content
- **Location Support**: Add location information to your tasks

### 🎨 **Modern Design**
- Clean, intuitive interface
- Dark/light mode support
- Consistent color scheme
- Smooth animations and transitions
- Accessibility features

### ⚙️ **Settings & Data Management**
- Reset onboarding experience
- Clear all data
- App version and build information

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Storage**: AsyncStorage
- **Icons**: Ionicons
- **Styling**: StyleSheet with dynamic theming

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Task-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on your preferred platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator  
   - Press `w` for web browser
   - Scan the QR code with Expo Go app

## 🏗 Project Structure

```
Task-App/
├── app/                    # Main app directory (Expo Router)
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Tasks tab (main screen)
│   │   ├── explore.tsx    # Settings tab
│   │   └── _layout.tsx    # Tab layout configuration
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── onboarding-screen.tsx    # Welcome/onboarding flow
│   ├── task-list-screen.tsx     # Main task list view
│   ├── add-task-screen.tsx      # Add new task form
│   ├── main-app-screen.tsx      # App state management
│   └── [other components]
├── constants/            # App constants and theming
│   └── theme.ts         # Color scheme and styling
└── hooks/              # Custom React hooks
```

## 🎯 Key Components

### OnboardingScreen
- Multi-step introduction with smooth transitions
- Feature highlights with icons and descriptions
- Skip functionality and progress indicators

### TaskListScreen  
- Comprehensive task display with cards
- Search and filter functionality
- Sort options (date added, status, due date)
- Quick action buttons (update status, delete)

### AddTaskScreen
- Form validation and user feedback
- Real-time task preview
- Date/time input with formatting
- Character counters and input limits

### MainAppScreen
- Navigation state management
- Onboarding completion tracking
- Screen transitions and app flow

## 💾 Data Storage

The app uses AsyncStorage for local data persistence:
- **Tasks**: Stored as JSON array with task objects
- **Onboarding**: Boolean flag for completion status
- **Offline-first**: All data is stored locally on device

## 🎨 Design System

### Colors
- **Primary**: #6B73FF (Purple)
- **Success**: #4ECDC4 (Teal)
- **Warning**: #FFE66D (Yellow)
- **Error**: #FF4757 (Red)
- **Dark/Light**: Adaptive theming support

### Task Status Colors
- **Pending**: Yellow (#FFE66D)
- **In Progress**: Purple (#6B73FF)
- **Completed**: Teal (#4ECDC4)
- **Cancelled**: Red (#FF6B6B)

## 🔧 Configuration

The app is configured in `app.json` with:
- App name and slug
- Platform-specific settings
- Splash screen configuration
- Icon and adaptive icon setup

## 🚀 Build and Deploy

### Development
```bash
npm run start        # Start development server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web
```

### Production Build
```bash
eas build --platform all    # Build for all platforms
eas submit                  # Submit to app stores
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Icons by [Ionicons](https://ionic.io/ionicons)
- Inspired by modern task management principles

---

**Made with ❤️ for efficient task management**
