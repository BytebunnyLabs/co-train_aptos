'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Input, Textarea } from '@heroui/react';
import { useToast } from '@/components/cotrain/ui/use-toast';
import { useAptosContract } from '@/hooks/useAptosContract';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import { Loader2, ArrowLeft, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface SessionFormData {
  name: string;
  description: string;
  rewardAmount: number;
  maxParticipants: number;
  duration: number;
}

interface SessionFormErrors {
  name?: string;
  description?: string;
  rewardAmount?: string;
  maxParticipants?: string;
  duration?: string;
}

export default function CreateTrainingSession() {
  const router = useRouter();
  const { toast } = useToast();
  const { createTrainingSession, isLoading, error, connected, account } = useAptosContract();
  const { trackTransaction, pendingTransactions } = useTransactionStatus();

  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    description: '',
    rewardAmount: 100,
    maxParticipants: 10,
    duration: 3600, // 1 hour in seconds
  });

  const [formErrors, setFormErrors] = useState<SessionFormErrors>({});

  const validateForm = (): boolean => {
    const errors: SessionFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Session name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Session name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (formData.rewardAmount <= 0) {
      errors.rewardAmount = 'Reward amount must be greater than 0';
    } else if (formData.rewardAmount > 10000) {
      errors.rewardAmount = 'Reward amount cannot exceed 10,000 APT';
    }

    if (formData.maxParticipants < 1) {
      errors.maxParticipants = 'Must allow at least 1 participant';
    } else if (formData.maxParticipants > 1000) {
      errors.maxParticipants = 'Cannot exceed 1,000 participants';
    }

    if (formData.duration < 300) {
      errors.duration = 'Duration must be at least 5 minutes (300 seconds)';
    } else if (formData.duration > 86400 * 7) {
      errors.duration = 'Duration cannot exceed 7 days';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SessionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a training session.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createTrainingSession({
        name: formData.name,
        description: formData.description,
        rewardAmount: formData.rewardAmount * 100000000, // Convert APT to octas
        maxParticipants: formData.maxParticipants,
        duration: formData.duration,
      });

      if (result.success && result.hash) {
        // Track the transaction
        await trackTransaction(result.hash, 'create_session', 'Creating training session');

        toast({
          title: "Session Creation Initiated",
          description: "Your training session is being created on the blockchain.",
        });

        // Redirect to sessions list after a short delay
        setTimeout(() => {
          router.push('/training/sessions');
        }, 2000);
      } else {
        toast({
          title: "Creation Failed",
          description: result.message || "Failed to create training session.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Unexpected Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="light"
            size="sm"
            onPress={() => router.back()}
            startContent={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Training Session</h1>
            <p className="text-default-400">
              Set up a new AI training session with rewards for participants
            </p>
          </div>
        </div>

        {/* Wallet Connection Status */}
        {!connected && (
          <Card className="mb-6 border-warning bg-warning-50">
            <CardBody className="flex flex-row items-center gap-3">
              <AlertCircle className="h-4 w-4 text-warning" />
              <p className="text-warning-700">
                You need to connect your wallet to create a training session.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <Card className="mb-6 border-primary bg-primary-50">
            <CardBody className="flex flex-row items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-primary-700">
                {pendingTransactions.length} transaction(s) pending...
              </p>
            </CardBody>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Session Details
            </h3>
            <p className="text-default-400">
              Configure your training session parameters
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Session Name *</label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced NLP Model Training"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description *</label>
                <Textarea
                  id="description"
                  placeholder="Describe the training objectives, requirements, and expectations..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              {/* Reward Amount */}
              <div className="space-y-2">
                <label htmlFor="rewardAmount" className="text-sm font-medium">Reward Pool (APT) *</label>
                <Input
                  id="rewardAmount"
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  placeholder="100"
                  value={formData.rewardAmount.toString()}
                  onChange={(e) => handleInputChange('rewardAmount', parseFloat(e.target.value) || 0)}
                  className={formErrors.rewardAmount ? 'border-red-500' : ''}
                />
                <p className="text-sm text-default-400">
                  Total APT tokens to be distributed as rewards
                </p>
                {formErrors.rewardAmount && (
                  <p className="text-sm text-red-500">{formErrors.rewardAmount}</p>
                )}
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <label htmlFor="maxParticipants" className="text-sm font-medium">Maximum Participants *</label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="10"
                  value={formData.maxParticipants.toString()}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                  className={formErrors.maxParticipants ? 'border-red-500' : ''}
                />
                {formErrors.maxParticipants && (
                  <p className="text-sm text-red-500">{formErrors.maxParticipants}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">Session Duration (seconds) *</label>
                <Input
                  id="duration"
                  type="number"
                  min="300"
                  max="604800"
                  placeholder="3600"
                  value={formData.duration.toString()}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  className={formErrors.duration ? 'border-red-500' : ''}
                />
                <p className="text-sm text-default-400">
                  Duration: {formatDuration(formData.duration)} (Min: 5 minutes, Max: 7 days)
                </p>
                {formErrors.duration && (
                  <p className="text-sm text-red-500">{formErrors.duration}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Card className="border-danger bg-danger-50">
                  <CardBody className="flex flex-row items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-danger" />
                    <p className="text-danger-700">{error}</p>
                  </CardBody>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="bordered"
                  onPress={() => router.back()}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isDisabled={!connected || isLoading}
                  className="flex-1"
                  startContent={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                >
                  {isLoading ? 'Creating Session...' : 'Create Training Session'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Preview Card */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Preview</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Session Name:</span>
                <p className="text-default-400">{formData.name || 'Untitled Session'}</p>
              </div>
              <div>
                <span className="font-medium">Reward Pool:</span>
                <p className="text-default-400">{formData.rewardAmount} APT</p>
              </div>
              <div>
                <span className="font-medium">Max Participants:</span>
                <p className="text-default-400">{formData.maxParticipants} users</p>
              </div>
              <div>
                <span className="font-medium">Duration:</span>
                <p className="text-default-400">{formatDuration(formData.duration)}</p>
              </div>
            </div>
            {formData.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-default-400 text-sm mt-1">{formData.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}