import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/cotrain/ui/progress';
import { Card, CardContent } from '@/components/cotrain/ui/card';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  description?: string;
  progress?: number;
}

interface AdvancedLoadingProps {
  steps: LoadingStep[];
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export const AdvancedLoading: React.FC<AdvancedLoadingProps> = ({
  steps,
  title = 'Processing...',
  description,
  className,
  compact = false,
}) => {
  const getStepIcon = (status: LoadingStep['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: LoadingStep['status']) => {
    switch (status) {
      case 'loading':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalProgress = (completedSteps / steps.length) * 100;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <Progress value={totalProgress} className="h-2 mt-1" />
        </div>
        <div className="text-xs text-muted-foreground">
          {completedSteps}/{steps.length}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              {/* Step Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.status)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', getStepColor(step.status))}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </div>
                )}
                {step.progress !== undefined && step.status === 'loading' && (
                  <Progress value={step.progress} className="h-1 mt-2" />
                )}
              </div>

              {/* Step Number */}
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Preset loading configurations
export const TransactionLoadingSteps: LoadingStep[] = [
  {
    id: 'prepare',
    label: 'Preparing transaction',
    status: 'pending',
    description: 'Building transaction payload',
  },
  {
    id: 'sign',
    label: 'Signing transaction',
    status: 'pending',
    description: 'Waiting for wallet confirmation',
  },
  {
    id: 'submit',
    label: 'Submitting to blockchain',
    status: 'pending',
    description: 'Broadcasting to Aptos network',
  },
  {
    id: 'confirm',
    label: 'Confirming transaction',
    status: 'pending',
    description: 'Waiting for blockchain confirmation',
  },
];

export const SessionCreationSteps: LoadingStep[] = [
  {
    id: 'validate',
    label: 'Validating parameters',
    status: 'pending',
    description: 'Checking session configuration',
  },
  {
    id: 'contract',
    label: 'Creating on blockchain',
    status: 'pending',
    description: 'Deploying session contract',
  },
  {
    id: 'index',
    label: 'Indexing session',
    status: 'pending',
    description: 'Updating session database',
  },
  {
    id: 'notify',
    label: 'Notifying participants',
    status: 'pending',
    description: 'Broadcasting session availability',
  },
];

export const RewardClaimSteps: LoadingStep[] = [
  {
    id: 'verify',
    label: 'Verifying eligibility',
    status: 'pending',
    description: 'Checking reward availability',
  },
  {
    id: 'calculate',
    label: 'Calculating rewards',
    status: 'pending',
    description: 'Computing final reward amount',
  },
  {
    id: 'transfer',
    label: 'Transferring tokens',
    status: 'pending',
    description: 'Sending APT to your wallet',
  },
  {
    id: 'update',
    label: 'Updating records',
    status: 'pending',
    description: 'Recording reward claim',
  },
];

// Hook for managing loading steps
export const useLoadingSteps = (initialSteps: LoadingStep[]) => {
  const [steps, setSteps] = React.useState<LoadingStep[]>(initialSteps);

  const updateStep = React.useCallback((
    stepId: string, 
    updates: Partial<LoadingStep>
  ) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const setStepStatus = React.useCallback((stepId: string, status: LoadingStep['status']) => {
    updateStep(stepId, { status });
  }, [updateStep]);

  const setStepProgress = React.useCallback((stepId: string, progress: number) => {
    updateStep(stepId, { progress });
  }, [updateStep]);

  const resetSteps = React.useCallback(() => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: undefined })));
  }, []);

  const startStep = React.useCallback((stepId: string) => {
    setStepStatus(stepId, 'loading');
  }, [setStepStatus]);

  const completeStep = React.useCallback((stepId: string) => {
    setStepStatus(stepId, 'completed');
  }, [setStepStatus]);

  const errorStep = React.useCallback((stepId: string, description?: string) => {
    updateStep(stepId, { status: 'error', description });
  }, [updateStep]);

  const isCompleted = React.useMemo(() => {
    return steps.every(step => step.status === 'completed');
  }, [steps]);

  const hasError = React.useMemo(() => {
    return steps.some(step => step.status === 'error');
  }, [steps]);

  const currentStep = React.useMemo(() => {
    return steps.find(step => step.status === 'loading');
  }, [steps]);

  return {
    steps,
    updateStep,
    setStepStatus,
    setStepProgress,
    resetSteps,
    startStep,
    completeStep,
    errorStep,
    isCompleted,
    hasError,
    currentStep,
  };
};