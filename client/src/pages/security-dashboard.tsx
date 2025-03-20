
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function SecurityDashboardPage() {
  const { user, setupMFA, enableMFA, disableMFA, changePassword } = useAuth();
  const { toast } = useToast();
  const [securityAssessment, setSecurityAssessment] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // MFA setup state
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupMfaOpen, setSetupMfaOpen] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Fetch security assessment
  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const res = await apiRequest('GET', '/api/security/assessment', null);
        const data = await res.json();
        setSecurityAssessment(data);
        
        const logsRes = await apiRequest('GET', '/api/security/audit-logs?limit=20', null);
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs);
      } catch (error) {
        console.error('Failed to fetch security data:', error);
        toast({
          title: "Error",
          description: "Failed to load security information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSecurityData();
  }, [toast]);
  
  // Handler for MFA setup
  const handleSetupMFA = async () => {
    try {
      const data = await setupMFA();
      setMfaSetupData(data);
      setSetupMfaOpen(true);
    } catch (error) {
      console.error('MFA setup error:', error);
      toast({
        title: "Error",
        description: "Failed to setup MFA",
        variant: "destructive"
      });
    }
  };
  
  // Handler for MFA verification
  const handleEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await enableMFA(verificationCode);
      setSetupMfaOpen(false);
      setVerificationCode('');
      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully",
      });
    } catch (error) {
      console.error('MFA enable error:', error);
      toast({
        title: "Error",
        description: "Failed to verify MFA code",
        variant: "destructive"
      });
    }
  };
  
  // Handler for password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword);
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
      </div>
      
      <Tabs defaultValue="security">
        <TabsList className="mb-4">
          <TabsTrigger value="security">Security Overview</TabsTrigger>
          <TabsTrigger value="mfa">Two-Factor Authentication</TabsTrigger>
          <TabsTrigger value="password">Password Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="security">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {securityAssessment ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Password Strength</CardTitle>
                    <CardDescription>Assessment of user password security</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      securityAssessment.passwordStrength.status === 'good' ? 'text-green-500' :
                      securityAssessment.passwordStrength.status === 'warning' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {securityAssessment.passwordStrength.status === 'good' ? 'Good' :
                       securityAssessment.passwordStrength.status === 'warning' ? 'Warning' :
                       'Alert'}
                    </div>
                    <p className="mt-2">
                      {securityAssessment.passwordStrength.weakPasswords} of {securityAssessment.passwordStrength.totalUsers} users have weak passwords
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>MFA Adoption</CardTitle>
                    <CardDescription>Two-factor authentication usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      securityAssessment.mfaAdoption.status === 'good' ? 'text-green-500' :
                      securityAssessment.mfaAdoption.status === 'warning' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {securityAssessment.mfaAdoption.status === 'good' ? 'Good' :
                       securityAssessment.mfaAdoption.status === 'warning' ? 'Warning' :
                       'Alert'}
                    </div>
                    <p className="mt-2">
                      {securityAssessment.mfaAdoption.enabledUsers} of {securityAssessment.mfaAdoption.totalUsers} users have enabled MFA
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Data Encryption</CardTitle>
                    <CardDescription>Status of data encryption</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      securityAssessment.dataEncryption.status === 'good' ? 'text-green-500' :
                      securityAssessment.dataEncryption.status === 'warning' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {securityAssessment.dataEncryption.status === 'good' ? 'Good' :
                       securityAssessment.dataEncryption.status === 'warning' ? 'Warning' :
                       'Alert'}
                    </div>
                    <p className="mt-2">
                      {securityAssessment.dataEncryption.encryptedTables} of {securityAssessment.dataEncryption.totalTables} tables are encrypted
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p>Loading security assessment...</p>
            )}
          </div>
          
          {securityAssessment?.recommendations && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
                <CardDescription>Actions to improve your security posture</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {securityAssessment.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="mfa">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Protect your account with an additional layer of security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Enhanced Security</AlertTitle>
                  <AlertDescription>
                    Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end">
                  <Button onClick={handleSetupMFA}>Setup Two-Factor Authentication</Button>
                </div>
              </div>
              
              <Dialog open={setupMfaOpen} onOpenChange={setSetupMfaOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan the QR code with your authenticator app and enter the verification code below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {mfaSetupData && (
                    <div className="space-y-4 py-4">
                      <div className="flex justify-center">
                        <img 
                          src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(mfaSetupData.setupUri)}`} 
                          alt="QR Code for 2FA" 
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">
                          If you can't scan the QR code, enter this code manually:
                        </p>
                        <code className="bg-gray-100 p-2 rounded">{mfaSetupData.mfaSecret}</code>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">Verification Code</Label>
                        <Input
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSetupMfaOpen(false)}>Cancel</Button>
                    <Button onClick={handleEnableMFA}>Verify and Enable</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password Management</CardTitle>
              <CardDescription>Update your password and review password policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Password Requirements</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>At least 10 characters long</li>
                      <li>Contains uppercase and lowercase letters</li>
                      <li>Contains at least one number</li>
                      <li>Contains at least one special character</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end">
                  <Button onClick={() => setChangePasswordOpen(true)}>Change Password</Button>
                </div>
                
                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and a new secure password.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
                      <Button onClick={handleChangePassword}>Change Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Review activity and security events</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b">Time</th>
                        <th className="text-left p-2 border-b">User</th>
                        <th className="text-left p-2 border-b">Action</th>
                        <th className="text-left p-2 border-b">Resource</th>
                        <th className="text-left p-2 border-b">Result</th>
                        <th className="text-left p-2 border-b">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-2 border-b">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-2 border-b">{log.userId || 'System'}</td>
                          <td className="p-2 border-b">{log.action}</td>
                          <td className="p-2 border-b">{log.resource}</td>
                          <td className="p-2 border-b">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              log.result === 'success' ? 'bg-green-100 text-green-800' :
                              log.result === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {log.result}
                            </span>
                          </td>
                          <td className="p-2 border-b">{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No audit logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
