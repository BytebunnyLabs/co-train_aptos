'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/cotrain/ui/dialog';
import { Button } from '@/components/cotrain/ui/button';
import { Label } from '@/components/cotrain/ui/label';
import { Switch } from '@/components/cotrain/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/cotrain/ui/radio-group';
import { toast } from 'sonner';
import { Eye, Globe, Users, Lock } from 'lucide-react';

interface PrivacySettingsDialogProps {
  trigger?: React.ReactNode;
}

export function PrivacySettingsDialog({ trigger }: PrivacySettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    profileVisibility: 'public', // 'public', 'friends', 'private'
    showEmail: false,
    showWalletAddress: false,
    showTrainingHistory: true,
    showRewardStats: false,
    dataAnalytics: true,
    marketingEmails: false,
    thirdPartySharing: false,
    activityTracking: true,
    searchEngineIndexing: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would typically call an API to update privacy settings
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Privacy settings updated successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Privacy Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </DialogTitle>
          <DialogDescription>
            Control who can see your information and how it's used.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Profile Visibility
            </h3>
            
            <RadioGroup
              value={formData.profileVisibility}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, profileVisibility: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex-1">
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-muted-foreground">
                      Anyone can see your profile and activities
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friends" id="friends" />
                <Label htmlFor="friends" className="flex-1">
                  <div>
                    <div className="font-medium">Friends Only</div>
                    <div className="text-sm text-muted-foreground">
                      Only connected users can see your profile
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex-1">
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">
                      Your profile is hidden from others
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Information Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Information Display
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your profile
                  </p>
                </div>
                <Switch
                  checked={formData.showEmail}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, showEmail: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Wallet Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your wallet address publicly
                  </p>
                </div>
                <Switch
                  checked={formData.showWalletAddress}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, showWalletAddress: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Training History</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your participation in training sessions
                  </p>
                </div>
                <Switch
                  checked={formData.showTrainingHistory}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, showTrainingHistory: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Reward Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your earned rewards and rankings
                  </p>
                </div>
                <Switch
                  checked={formData.showRewardStats}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, showRewardStats: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Data Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Data Usage & Sharing
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics & Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve CoTrain with usage analytics
                  </p>
                </div>
                <Switch
                  checked={formData.dataAnalytics}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, dataAnalytics: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and updates
                  </p>
                </div>
                <Switch
                  checked={formData.marketingEmails}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Third-Party Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymized data with research partners
                  </p>
                </div>
                <Switch
                  checked={formData.thirdPartySharing}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, thirdPartySharing: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track your activity for personalized experience
                  </p>
                </div>
                <Switch
                  checked={formData.activityTracking}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, activityTracking: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Search Engine Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow search engines to index your public profile
                  </p>
                </div>
                <Switch
                  checked={formData.searchEngineIndexing}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, searchEngineIndexing: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Data Rights */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Rights</h3>
            
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Your Data Rights</p>
              <p className="text-sm text-muted-foreground">
                You have the right to access, correct, or delete your personal data. 
                Contact us if you need to exercise these rights.
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Data export will be available soon')}
                >
                  Export Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Account deletion request submitted')}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Save Privacy Settings'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}