import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  ArrowRight,
  Lightbulb,
  Target,
  Play,
  SkipForward
} from 'lucide-react';
import { Button } from '@/components/cotrain/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Badge } from '@/components/cotrain/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/cotrain/ui/dialog';
import { Progress } from '@/components/cotrain/ui/progress';

export interface GuideStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
  autoNext?: boolean;
  delayMs?: number;
}

export interface UserGuide {
  id: string;
  title: string;
  description: string;
  steps: GuideStep[];
  category: 'onboarding' | 'feature' | 'advanced';
  priority: number;
  trigger?: 'auto' | 'manual' | 'first-visit';
}

// Predefined guides
export const WalletOnboardingGuide: UserGuide = {
  id: 'wallet-onboarding',
  title: 'Connect Your Wallet',
  description: 'Learn how to connect your Aptos wallet to start participating in training sessions',
  category: 'onboarding',
  priority: 1,
  trigger: 'first-visit',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to CoTrain!',
      content: 'CoTrain is a decentralized AI training platform where you can contribute to AI model training and earn APT tokens as rewards.',
    },
    {
      id: 'wallet-required',
      title: 'Wallet Required',
      content: 'To participate in training sessions and claim rewards, you need to connect an Aptos-compatible wallet like Petra, Martian, or Pontem.',
    },
    {
      id: 'connect-wallet',
      title: 'Connect Your Wallet',
      content: 'Click the wallet connection button to select and connect your preferred Aptos wallet.',
      target: '[data-guide="wallet-button"]',
      position: 'bottom',
    },
    {
      id: 'wallet-connected',
      title: 'Wallet Connected!',
      content: 'Great! Your wallet is now connected. You can now create training sessions, join existing ones, and claim your earned rewards.',
    },
  ],
};

export const TrainingOnboardingGuide: UserGuide = {
  id: 'training-onboarding',
  title: 'Training Sessions',
  description: 'Learn how to participate in AI training sessions',
  category: 'onboarding',
  priority: 2,
  trigger: 'manual',
  steps: [
    {
      id: 'training-intro',
      title: 'Training Sessions',
      content: 'Training sessions are collaborative AI model training tasks where multiple participants contribute computational resources.',
    },
    {
      id: 'browse-sessions',
      title: 'Browse Sessions',
      content: 'Visit the Sessions page to see all available training sessions. You can filter by status, reward amount, and participant count.',
      target: '[data-guide="sessions-link"]',
      position: 'bottom',
    },
    {
      id: 'join-session',
      title: 'Join a Session',
      content: 'Click on any active session to view details and join. Make sure you have enough computational resources available.',
    },
    {
      id: 'contribute',
      title: 'Contribute & Earn',
      content: 'Once joined, your contributions will be automatically tracked. Rewards are distributed based on your contribution quality and duration.',
    },
  ],
};

export const RewardsOnboardingGuide: UserGuide = {
  id: 'rewards-onboarding',
  title: 'Claim Your Rewards',
  description: 'Learn how to view and claim your earned APT tokens',
  category: 'onboarding',
  priority: 3,
  trigger: 'manual',
  steps: [
    {
      id: 'rewards-intro',
      title: 'Reward System',
      content: 'You earn APT tokens by participating in training sessions. Rewards are calculated based on your contribution quality and participation time.',
    },
    {
      id: 'view-rewards',
      title: 'View Your Rewards',
      content: 'Go to the Rewards page to see all your earned rewards, both claimed and unclaimed.',
      target: '[data-guide="rewards-link"]',
      position: 'bottom',
    },
    {
      id: 'claim-rewards',
      title: 'Claim Rewards',
      content: 'Click on any claimable reward to transfer the APT tokens to your wallet. You can also use batch claim for multiple rewards.',
    },
    {
      id: 'track-earnings',
      title: 'Track Your Earnings',
      content: 'The Rewards page shows your total earnings, claimed amounts, and reward history with detailed statistics.',
    },
  ],
};

interface UserGuideProps {
  guide: UserGuide;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const UserGuideComponent: React.FC<UserGuideProps> = ({
  guide,
  isOpen,
  onClose,
  onComplete,
}: UserGuideProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  const currentStep = guide.steps[currentStepIndex];
  const isLastStep = currentStepIndex === guide.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;
  const progress = ((currentStepIndex + 1) / guide.steps.length) * 100;

  // Handle element highlighting
  useEffect(() => {
    if (!isOpen || !currentStep?.target) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (element) {
      setHighlightedElement(element);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      element.classList.add('guide-highlight');
      
      return () => {
        element.classList.remove('guide-highlight');
      };
    }
  }, [currentStep, isOpen]);

  // Auto-advance for steps with autoNext
  useEffect(() => {
    if (!isOpen || !currentStep?.autoNext) return;

    const timer = setTimeout(() => {
      if (!isLastStep) {
        setCurrentStepIndex((prev: number) => prev + 1);
      }
    }, currentStep.delayMs || 3000);

    return () => clearTimeout(timer);
  }, [currentStep, isLastStep, isOpen]);

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev: number) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev: number) => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for highlighting */}
      {highlightedElement && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{guide.title}</h2>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {currentStepIndex + 1} of {guide.steps.length}
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current step content */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2">{currentStep.title}</h3>
                  <p className="text-sm text-gray-600">
                    {currentStep.content}
                  </p>
                  
                  {/* Step action button */}
                  {currentStep.action && (
                    <button
                      className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      onClick={currentStep.action.onClick}
                    >
                      {currentStep.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                {!isLastStep ? (
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                    onClick={handleNext}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                    onClick={handleComplete}
                  >
                    <Check className="w-4 h-4" />
                    Complete
                  </button>
                )}
              </div>
              
              <button
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                onClick={handleSkip}
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global styles for highlighting */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .guide-highlight {
            position: relative !important;
            z-index: 45 !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
            border-radius: 4px !important;
            transition: all 0.3s ease !important;
          }
        `
      }} />
    </>
  );
};

// Hook for managing user guides
export const useUserGuide = () => {
  const [activeGuide, setActiveGuide] = useState<UserGuide | null>(null);
  const [completedGuides, setCompletedGuides] = useState<string[]>([]);

  // Load completed guides from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cotrain-completed-guides');
    if (saved) {
      try {
        setCompletedGuides(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load completed guides:', error);
      }
    }
  }, []);

  // Save completed guides to localStorage
  const saveCompletedGuides = (guides: string[]) => {
    try {
      localStorage.setItem('cotrain-completed-guides', JSON.stringify(guides));
      setCompletedGuides(guides);
    } catch (error) {
      console.error('Failed to save completed guides:', error);
    }
  };

  const startGuide = (guide: UserGuide) => {
    setActiveGuide(guide);
  };

  const closeGuide = () => {
    setActiveGuide(null);
  };

  const completeGuide = (guideId: string) => {
    const newCompleted = [...completedGuides, guideId];
    saveCompletedGuides(newCompleted);
    setActiveGuide(null);
  };

  const isGuideCompleted = (guideId: string) => {
    return completedGuides.includes(guideId);
  };

  const resetGuides = () => {
    localStorage.removeItem('cotrain-completed-guides');
    setCompletedGuides([]);
  };

  // Auto-start first-visit guides
  useEffect(() => {
    const firstVisitGuides = [
      WalletOnboardingGuide,
      TrainingOnboardingGuide,
      RewardsOnboardingGuide,
    ].filter(guide => 
      guide.trigger === 'first-visit' && !isGuideCompleted(guide.id)
    );

    if (firstVisitGuides.length > 0 && !activeGuide) {
      // Start the highest priority guide
      const nextGuide = firstVisitGuides.sort((a, b) => a.priority - b.priority)[0];
      setTimeout(() => startGuide(nextGuide), 1000); // Delay to ensure UI is ready
    }
  }, [completedGuides, activeGuide, isGuideCompleted]);

  return {
    activeGuide,
    completedGuides,
    startGuide,
    closeGuide,
    completeGuide: (guide: UserGuide) => completeGuide(guide.id),
    isGuideCompleted,
    resetGuides,
    
    // Predefined guides
    guides: {
      wallet: WalletOnboardingGuide,
      training: TrainingOnboardingGuide,
      rewards: RewardsOnboardingGuide,
    },
  };
};

// Quick help button component
interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({
  onClick,
  className,
}: HelpButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      Help
    </Button>
  );
};

// Export the main component
export default UserGuideComponent;