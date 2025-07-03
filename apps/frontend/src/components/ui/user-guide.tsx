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
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const currentStep = guide.steps[currentStepIndex];
  const isLastStep = currentStepIndex === guide.steps.length - 1;
  const progress = ((currentStepIndex + 1) / guide.steps.length) * 100;

  // Highlight target element
  useEffect(() => {
    if (currentStep?.target && isOpen) {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.classList.add('guide-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('guide-highlight');
      }
    };
  }, [currentStep, isOpen, highlightedElement]);

  // Auto-advance steps
  useEffect(() => {
    if (currentStep?.autoNext && currentStep.delayMs) {
      const timer = setTimeout(() => {
        handleNext();
      }, currentStep.delayMs);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleStepAction = () => {
    if (currentStep?.action) {
      currentStep.action.onClick();
    }
    handleNext();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      
      {/* Guide Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md z-50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {guide.title}
              </DialogTitle>
              <Badge variant="outline">
                {currentStepIndex + 1} / {guide.steps.length}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{currentStep.title}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content */}
            <div className="py-4">
              <p className="text-muted-foreground leading-relaxed">
                {currentStep.content}
              </p>
            </div>

            {/* Action Button */}
            {currentStep.action && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <Button 
                    onClick={handleStepAction}
                    className="w-full"
                    size="sm"
                  >
                    {currentStep.action.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              </div>

              <Button onClick={handleNext} size="sm">
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Highlight styles */}
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          animation: guide-pulse 2s infinite;
        }
        
        @keyframes guide-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); }
        }
      `}</style>
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
  }, [completedGuides, activeGuide]);

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
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn('', className)}
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      Help
    </Button>
  );
};