'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';

interface EditProfileDialogProps {
  trigger?: React.ReactNode;
}

export function EditProfileDialog({ trigger }: EditProfileDialogProps) {
  const { user, setUser, accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.username.trim()) {
        toast.error('Username is required');
        return;
      }

      if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Update user profile via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      
      toast.success('Profile updated successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
  };

  return (
    <>
      {trigger || (
        <Button 
          variant="bordered" 
          className="flex items-center gap-2"
          onPress={() => setOpen(true)}
          startContent={<Edit className="h-4 w-4" />}
        >
          Edit Profile
        </Button>
      )}
      
      <Modal isOpen={open} onOpenChange={setOpen} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Edit Profile</h3>
            <p className="text-sm text-default-500">
              Update your account information and preferences.
            </p>
          </ModalHeader>
          <ModalBody>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Input
              id="username"
              type="text"
              label="Username *"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter your username"
              isRequired
              isDisabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              label="Email *"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              isRequired
              isDisabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="flex-1"
              startContent={!loading && <Save className="h-4 w-4" />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="bordered"
              onPress={() => {
                resetForm();
                setOpen(false);
              }}
              isDisabled={loading}
              startContent={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
          </div>
        </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}