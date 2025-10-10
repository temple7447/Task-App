/**
 * Onboarding Screen Route - Expo Router Implementation
 * 
 * This screen handles the initial user onboarding experience with a beautiful
 * multi-step introduction to the TaskMaster application features.
 * 
 * Features:
 * - 4-step guided tour of app capabilities
 * - Smooth animations and transitions
 * - Progress indicators and navigation controls
 * - Skip functionality for returning users
 * - Persistent completion tracking
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StorageService } from '@/services/storage-service';

const { width, height } = Dimensions.get('window');

// Define the onboarding steps with clear, informative content
interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to TaskMaster',
    description: 'Your personal task management companion. Organize, track, and complete your tasks efficiently with our intuitive interface.',
    icon: 'checkmark-circle',
    color: '#6B73FF',
  },
  {
    id: 2,
    title: 'Create & Organize Tasks',
    description: 'Add tasks with detailed information including titles, descriptions, due dates, and locations. Keep everything organized in one place.',
    icon: 'add-circle',
    color: '#4ECDC4',
  },
  {
    id: 3,
    title: 'Track Your Progress',
    description: 'Mark tasks as pending, in progress, completed, or cancelled. Use powerful sorting and filtering to find exactly what you need.',
    icon: 'stats-chart',
    color: '#FFE66D',
  },
  {
    id: 4,
    title: 'Stay Productive',
    description: 'Never miss a deadline with location-based tasks, comprehensive management tools, and an interface designed for productivity.',
    icon: 'rocket',
    color: '#FF6B6B',
  },
];

export default function OnboardingScreen() {
  // Get the current color scheme for theming
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Component state management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation references for smooth transitions
  const fadeAnimationValue = useRef(new Animated.Value(1)).current;
  const slideAnimationValue = useRef(new Animated.Value(0)).current;

  /**
   * Handles navigation to the next onboarding step with animation
   */
  const handleNextStep = () => {
    if (isAnimating) return; // Prevent multiple simultaneous animations
    
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      // Animate to next step
      animateToStep(currentStepIndex + 1);
    } else {
      // Complete onboarding and navigate to main app
      completeOnboarding();
    }
  };

  /**
   * Handles navigation to the previous onboarding step with animation
   */
  const handlePreviousStep = () => {
    if (isAnimating || currentStepIndex === 0) return;
    
    animateToStep(currentStepIndex - 1);
  };

  /**
   * Animates the transition between onboarding steps
   * @param targetStepIndex - The index of the step to animate to
   */
  const animateToStep = (targetStepIndex: number) => {
    setIsAnimating(true);

    // Fade out current content
    Animated.timing(fadeAnimationValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Update step index
      setCurrentStepIndex(targetStepIndex);
      
      // Animate slide effect based on direction
      const slideDirection = targetStepIndex > currentStepIndex ? 1 : -1;
      slideAnimationValue.setValue(slideDirection * 50);
      
      // Fade in new content with slide
      Animated.parallel([
        Animated.timing(fadeAnimationValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimationValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  /**
   * Handles skipping the onboarding process
   */
  const handleSkipOnboarding = () => {
    completeOnboarding();
  };

  /**
   * Completes the onboarding process and navigates to the main app
   */
  const completeOnboarding = async () => {
    try {
      // Save onboarding completion status to persistent storage
      await StorageService.setOnboardingCompleted(true);
      
      // Navigate to the main task list screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Even if saving fails, continue to main app to avoid blocking user
      router.replace('/(tabs)');
    }
  };

  // Get current step data for rendering
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Skip Button - Only show if not on last step */}
      {!isLastStep && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipOnboarding}
          accessibilityLabel="Skip onboarding tutorial"
          accessibilityHint="Skip the introduction and go directly to the app"
        >
          <Text style={[styles.skipButtonText, { color: colors.placeholder }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Progress Indicators */}
      <View style={styles.progressIndicatorContainer}>
        {ONBOARDING_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index === currentStepIndex 
                  ? colors.primary 
                  : colors.border,
                transform: [
                  {
                    scale: index === currentStepIndex ? 1.2 : 1,
                  },
                ],
              },
            ]}
            accessibilityLabel={`Step ${index + 1} of ${ONBOARDING_STEPS.length}`}
          />
        ))}
      </View>

      {/* Main Content Area */}
      <Animated.View 
        style={[
          styles.contentContainer, 
          { 
            opacity: fadeAnimationValue,
            transform: [
              { translateX: slideAnimationValue }
            ],
          }
        ]}
      >
        {/* Step Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${currentStep.color}20` },
            ]}
          >
            <Ionicons
              name={currentStep.icon}
              size={80}
              color={currentStep.color}
            />
          </View>
        </View>

        {/* Step Content */}
        <View style={styles.textContainer}>
          <Text
            style={[styles.stepTitle, { color: colors.text }]}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            {currentStep.title}
          </Text>
          
          <Text
            style={[styles.stepDescription, { color: colors.placeholder }]}
            accessibilityRole="text"
          >
            {currentStep.description}
          </Text>
        </View>
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtonsContainer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.previousButton,
            { opacity: isFirstStep ? 0.3 : 1 },
          ]}
          onPress={handlePreviousStep}
          disabled={isFirstStep || isAnimating}
          accessibilityLabel="Go to previous step"
          accessibilityState={{ disabled: isFirstStep || isAnimating }}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={colors.primary} 
          />
          <Text style={[styles.previousButtonText, { color: colors.primary }]}>
            Previous
          </Text>
        </TouchableOpacity>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNextStep}
          disabled={isAnimating}
          accessibilityLabel={isLastStep ? 'Start using TaskMaster' : 'Go to next step'}
          accessibilityState={{ disabled: isAnimating }}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Text>
          {!isLastStep && (
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="white" 
            />
          )}
          {isLastStep && (
            <Ionicons 
              name="arrow-forward" 
              size={24} 
              color="white" 
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // Smooth transition animation for dot scaling
    transition: 'transform 0.3s ease-in-out',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: width * 0.85, // Ensure text doesn't touch screen edges
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34, // Improve text readability
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3, // Slight letter spacing for better readability
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    minWidth: 100,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minWidth: 140,
    justifyContent: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});