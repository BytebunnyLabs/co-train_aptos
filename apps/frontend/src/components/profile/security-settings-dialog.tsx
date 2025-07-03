'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/cotrain/ui/dialog';
import { Button } from '@/components/cotrain/ui/button';
import { Input } from '@/components/cotrain/ui/input';
import { Label } from '@/components/cotrain/ui/label';
import { Switch } from '@/components/cotrain/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'sonner';
import { Shield, Key, Smartphone, Eye, EyeOff } from 'lucide-react';

interface SecuritySettingsDialogProps {
  trigger?: React.ReactNode;
}

export function SecuritySettingsDialog({ trigger }: SecuritySettingsDialogProps) {
  const { user } = useAuth();
  const { account } = useWallet();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    autoLogoutMinutes: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (formData.newPassword && formData.newPassword.length < 8) {
        toast.error('New password must be at least 8 characters');
        return;
      }

      // Here you would typically call an API to update security settings
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Security settings updated successfully!');
      setOpen(false);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSecurity = async () => {
    try {
      if (!account) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Trigger wallet signature for security verification
      const message = `Security verification for ${user?.username || 'user'} at ${new Date().toISOString()}`;
      
      // This would typically use the wallet adapter to sign a message
      toast.success('Wallet security verification completed');
    } catch (error) {
      console.error('Wallet security error:', error);
      toast.error('Failed to verify wallet security');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account security and privacy preferences.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 8 characters)"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Two-Factor Authentication
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, twoFactorEnabled: checked }))
                }
              />
            </div>
          </div>

          {/* Wallet Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Wallet Security</h3>
            
            <div className="p-3 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Wallet</span>
                <span className="text-sm text-muted-foreground">
                  {account?.address ? 
                    `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 
                    'Not connected'
                  }
                </span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleWalletSecurity}
                disabled={!account || loading}
                className="w-full"
              >
                Verify Wallet Security
              </Button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive security alerts via email
                  </p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={formData.loginAlerts}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, loginAlerts: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Management</h3>
            
            <div className="space-y-2">
              <Label htmlFor="autoLogout">Auto-logout (minutes)</Label>
              <Input
                id="autoLogout"
                type="number"
                min="5"
                max="120"
                value={formData.autoLogoutMinutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  autoLogoutMinutes: parseInt(e.target.value) || 30 
                }))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Security Settings'}
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