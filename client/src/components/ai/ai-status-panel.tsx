import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { AlertCircle, CheckCircle, Server } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type AIServiceStatus = {
  status: 'available' | 'limited' | 'unavailable'
  usage: number
  rateLimitPerMinute?: number
  requestCount?: number
  lastUsed?: string
  backupAvailable?: boolean
  primaryKey?: string
}

type AIServicesStatus = Record<string, AIServiceStatus>

/**
 * AI Status Panel component displays the current status of all AI services
 * This is used in the AI dashboard to show the health of different AI components
 */
export function AIStatusPanel() {
  const [aiStatus, setAiStatus] = useState<AIServicesStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAIStatus = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<AIServicesStatus>('/api/ai/status')
      setAiStatus(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching AI status:', err)
      setError('Failed to load AI service status')
      toast({
        title: 'Status Update Failed',
        description: 'Could not retrieve current AI service status',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAIStatus()
    
    // Poll for status updates every 60 seconds
    const intervalId = setInterval(() => {
      fetchAIStatus()
    }, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  const getStatusColor = (status: 'available' | 'limited' | 'unavailable') => {
    switch (status) {
      case 'available':
        return 'text-green-500'
      case 'limited':
        return 'text-amber-500'
      case 'unavailable':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: 'available' | 'limited' | 'unavailable') => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'limited':
        return <Server className="h-5 w-5 text-amber-500" />
      case 'unavailable':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Server className="h-5 w-5 text-gray-500" />
    }
  }

  // Format service name for display (e.g., "xray_analysis" -> "X-ray Analysis")
  const formatServiceName = (serviceName: string) => {
    return serviceName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const renderServiceStatus = (name: string, status: AIServiceStatus) => {
    return (
      <div key={name} className="mb-6 p-3 border border-gray-100 rounded-md hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {getStatusIcon(status.status)}
            <span className="ml-2 font-medium">{formatServiceName(name)}</span>
            {status.backupAvailable && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Backup ready
              </span>
            )}
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
            {status.status === 'available' ? 'Active' : status.status === 'limited' ? 'High Load' : 'Unavailable'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>API Usage</span>
          <span>{Math.round(status.usage)}%</span>
        </div>
        
        <Progress 
          value={status.usage} 
          className={`h-2 ${
            status.usage > 80 
              ? 'bg-red-200' 
              : status.usage > 50 
                ? 'bg-amber-200' 
                : 'bg-green-200'
          }`} 
        />
        
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
          {status.rateLimitPerMinute && (
            <div className="bg-gray-50 px-2 py-1 rounded">
              <span className="font-medium">Rate limit:</span> {status.rateLimitPerMinute}/min
            </div>
          )}
          
          {status.requestCount !== undefined && (
            <div className="bg-gray-50 px-2 py-1 rounded">
              <span className="font-medium">Requests:</span> {status.requestCount}
            </div>
          )}
          
          {status.lastUsed && (
            <div className="bg-gray-50 px-2 py-1 rounded">
              <span className="font-medium">Last used:</span> {new Date(status.lastUsed).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {/* Show key info for administrators only */}
        {status.primaryKey && (
          <div className="mt-2 text-xs text-gray-400">
            Key ending in: ...{status.primaryKey.slice(-4)}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            AI Engine Status
          </CardTitle>
          <CardDescription>Current status of AI services</CardDescription>
        </CardHeader>
        <CardContent>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-2 w-full mb-1" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            AI Engine Status Error
          </CardTitle>
          <CardDescription>Failed to load AI service status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
            <button 
              onClick={fetchAIStatus}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="mr-2 h-5 w-5" />
          AI Engine Status
        </CardTitle>
        <CardDescription>Current status of AI services</CardDescription>
      </CardHeader>
      <CardContent>
        {aiStatus && Object.entries(aiStatus).map(([name, status]) => renderServiceStatus(name, status))}
        <div className="mt-2 text-xs text-gray-500 text-right">
          Last updated: {new Date().toLocaleTimeString()}
          <button 
            onClick={fetchAIStatus} 
            className="ml-2 text-blue-500 hover:underline"
          >
            Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  )
}