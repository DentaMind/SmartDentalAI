'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  appointmentReminders: boolean;
  labResults: boolean;
  insuranceUpdates: boolean;
  diagnosisUpdates: boolean;
}

export function NotificationPreferences({ userId }: { userId: number }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    appointmentReminders: true,
    labResults: true,
    insuranceUpdates: true,
    diagnosisUpdates: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/notifications/preferences?userId=${userId}`);
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    try {
      const newValue = !preferences[key];
      const updatedPreferences = { ...preferences, [key]: newValue };
      
      await fetch(`/api/notifications/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { [key]: newValue } })
      });

      setPreferences(updatedPreferences);
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={() => handleToggle('emailEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">Receive push notifications</p>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={() => handleToggle('pushEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
            </div>
            <Switch
              checked={preferences.appointmentReminders}
              onCheckedChange={() => handleToggle('appointmentReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lab Results</Label>
              <p className="text-sm text-gray-500">Get notified when lab results are ready</p>
            </div>
            <Switch
              checked={preferences.labResults}
              onCheckedChange={() => handleToggle('labResults')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Insurance Updates</Label>
              <p className="text-sm text-gray-500">Get notified about insurance claim status</p>
            </div>
            <Switch
              checked={preferences.insuranceUpdates}
              onCheckedChange={() => handleToggle('insuranceUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Diagnosis Updates</Label>
              <p className="text-sm text-gray-500">Get notified about new diagnoses</p>
            </div>
            <Switch
              checked={preferences.diagnosisUpdates}
              onCheckedChange={() => handleToggle('diagnosisUpdates')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 