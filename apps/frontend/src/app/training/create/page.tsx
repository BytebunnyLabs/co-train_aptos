'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Button } from '@/components/cotrain/ui/button';
import { Input } from '@/components/cotrain/ui/input';
import { Label } from '@/components/cotrain/ui/label';
import { Textarea } from '@/components/cotrain/ui/textarea';
import { Alert, AlertDescription } from '@/components/cotrain/ui/alert';
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
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Training Session</h1>
            <p className="text-muted-foreground">
              Set up a new AI training session with rewards for participants
            </p>
          </div>
        </div>

        {/* Wallet Connection Status */}
        {!connected && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to connect your wallet to create a training session.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {pendingTransactions.length} transaction(s) pending...
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Session Details
            </CardTitle>
            <CardDescription>
              Configure your training session parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Session Name *</Label>
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
                <Label htmlFor="description">Description *</Label>
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
                <Label htmlFor="rewardAmount">Reward Pool (APT) *</Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  placeholder="100"
                  value={formData.rewardAmount}
                  onChange={(e) => handleInputChange('rewardAmount', parseFloat(e.target.value) || 0)}
                  className={formErrors.rewardAmount ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  Total APT tokens to be distributed as rewards
                </p>
                {formErrors.rewardAmount && (
                  <p className="text-sm text-red-500">{formErrors.rewardAmount}</p>
                )}
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Maximum Participants *</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="10"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                  className={formErrors.maxParticipants ? 'border-red-500' : ''}
                />
                {formErrors.maxParticipants && (
                  <p className="text-sm text-red-500">{formErrors.maxParticipants}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Session Duration (seconds) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="300"
                  max="604800"
                  placeholder="3600"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  className={formErrors.duration ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(formData.duration)} (Min: 5 minutes, Max: 7 days)
                </p>
                {formErrors.duration && (
                  <p className="text-sm text-red-500">{formErrors.duration}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!connected || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Training Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Session Name:</span>
                <p className="text-muted-foreground">{formData.name || 'Untitled Session'}</p>
              </div>
              <div>
                <span className="font-medium">Reward Pool:</span>
                <p className="text-muted-foreground">{formData.rewardAmount} APT</p>
              </div>
              <div>
                <span className="font-medium">Max Participants:</span>
                <p className="text-muted-foreground">{formData.maxParticipants} users</p>
              </div>
              <div>
                <span className="font-medium">Duration:</span>
                <p className="text-muted-foreground">{formatDuration(formData.duration)}</p>
              </div>
            </div>
            {formData.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground text-sm mt-1">{formData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}