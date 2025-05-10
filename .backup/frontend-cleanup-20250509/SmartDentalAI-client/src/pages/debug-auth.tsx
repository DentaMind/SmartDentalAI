import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export default function DebugAuthPage() {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/user');
        setSessionInfo(response.data);
        setMessage('Session active');
        setStatus('success');
      } catch (err: any) {
        setMessage(err.message || 'No active session');
        setStatus('error');
        setSessionInfo(null);
      }
    };
    
    checkSession();
  }, [user]);
  
  const handleLogin = async () => {
    setStatus('loading');
    setMessage('Attempting login...');
    
    try {
      // First, make a direct API call and capture the raw response
      try {
        const directResponse = await api.post('/auth/login', { username, password });
        setRawResponse(directResponse.data);
        setMessage('Direct API call successful');
      } catch (err: any) {
        setRawResponse(err.response?.data || err.message);
        setMessage(`Direct API call failed: ${err.message}`);
        setStatus('error');
        return;
      }
      
      // Then try the actual login through the auth hook
      await login(username, password);
      setMessage('Login successful');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setMessage(`Login error: ${err.message}`);
      console.error('Login error details:', err);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      setMessage('Logged out successfully');
      setStatus('idle');
      setRawResponse(null);
      setSessionInfo(null);
    } catch (err: any) {
      setMessage(`Logout error: ${err.message}`);
      setStatus('error');
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-100">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auth Debug Tool</span>
            <Badge variant={user ? "default" : "destructive"} className={user ? "bg-green-500 hover:bg-green-600" : ""}>
              {user ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password" 
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleLogin} 
                disabled={status === 'loading' || !username || !password}
                className="flex-1"
              >
                {status === 'loading' ? 'Logging in...' : 'Login'}
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex-1"
                disabled={!user}
              >
                Logout
              </Button>
            </div>
          </div>
          
          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <div className="font-semibold">Status: <span className={
              status === 'success' ? 'text-green-600' : 
              status === 'error' ? 'text-red-600' : 
              status === 'loading' ? 'text-blue-600' : 'text-slate-600'
            }>{status}</span></div>
            <div className="mt-1">{message}</div>
          </div>
          
          {user && (
            <div className="rounded-md bg-green-50 p-4 text-sm">
              <div className="font-semibold mb-2">Auth User Info</div>
              <pre className="overflow-auto text-xs">{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
          
          {sessionInfo && (
            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <div className="font-semibold mb-2">Session Info</div>
              <pre className="overflow-auto text-xs">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
          )}
          
          {rawResponse && (
            <div className="rounded-md bg-yellow-50 p-4 text-sm">
              <div className="font-semibold mb-2">Raw API Response</div>
              <pre className="overflow-auto text-xs">{JSON.stringify(rawResponse, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}