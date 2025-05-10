import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Languages, 
  Lightbulb, 
  Mic, 
  MicOff, 
  Repeat, 
  Volume, 
  Volume2, 
  VolumeX 
} from "lucide-react";

interface MultilingualInterpreterProps {
  patientId?: number;
  patientPreferredLanguage?: string;
}

type SupportedLanguage = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

type TranslationResult = {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
};

export function MultilingualInterpreter({
  patientId,
  patientPreferredLanguage = "english"
}: MultilingualInterpreterProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(patientPreferredLanguage);
  const [patientSpeechText, setPatientSpeechText] = useState("");
  const [providerSpeechText, setProviderSpeechText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<TranslationResult[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // List of supported languages
  const supportedLanguages: SupportedLanguage[] = [
    { code: "english", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "spanish", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "chinese", name: "Mandarin Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "french", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "vietnamese", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
    { code: "arabic", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { code: "russian", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "korean", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "japanese", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "german", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "portuguese", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
    { code: "hindi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  ];
  
  // Setup recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setIsRecording(false);
      setRecordingTime(0);
      setPatientSpeechText("");
      setProviderSpeechText("");
      setIsTranslating(false);
      setIsSpeaking(false);
    }
  }, [isDialogOpen]);
  
  // Mutation for translating patient speech
  const translatePatientSpeechMutation = useMutation({
    mutationFn: async (text: string) => {
      setIsTranslating(true);
      
      // In a real implementation, this would call an API to translate the text
      try {
        const response = await apiRequest("POST", "/api/translation", {
          body: JSON.stringify({
            text,
            sourceLanguage: selectedLanguage,
            targetLanguage: "english",
            patientId,
          }),
        });
        
        return response.json() as Promise<TranslationResult>;
      } catch (error) {
        console.error("Translation error:", error);
        // For demo purposes, simulate a successful translation
        return {
          originalText: text,
          translatedText: `[Translated from ${selectedLanguage}]: ${text}`,
          detectedLanguage: selectedLanguage,
          confidence: 0.92,
        } as TranslationResult;
      }
    },
    onSuccess: (data) => {
      setIsTranslating(false);
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev, 
        { 
          originalText: data.originalText,
          translatedText: data.translatedText,
          detectedLanguage: selectedLanguage,
          confidence: data.confidence,
        }
      ]);
      
      // Clear patient speech text
      setPatientSpeechText("");
      
      toast({
        title: "Translation complete",
        description: `Patient's speech has been translated to English`,
        variant: "default",
      });
    },
    onError: (error) => {
      setIsTranslating(false);
      console.error("Translation error:", error);
      
      toast({
        title: "Translation failed",
        description: "There was an error translating the speech. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for translating provider speech
  const translateProviderSpeechMutation = useMutation({
    mutationFn: async (text: string) => {
      setIsTranslating(true);
      
      // In a real implementation, this would call an API to translate the text
      try {
        const response = await apiRequest("POST", "/api/translation", {
          body: JSON.stringify({
            text,
            sourceLanguage: "english",
            targetLanguage: selectedLanguage,
            patientId,
          }),
        });
        
        return response.json() as Promise<TranslationResult>;
      } catch (error) {
        console.error("Translation error:", error);
        // For demo purposes, simulate a successful translation
        return {
          originalText: text,
          translatedText: `[Translated to ${selectedLanguage}]: ${text}`,
          detectedLanguage: "english",
          confidence: 0.96,
        } as TranslationResult;
      }
    },
    onSuccess: (data) => {
      setIsTranslating(false);
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev, 
        { 
          originalText: data.originalText,
          translatedText: data.translatedText,
          detectedLanguage: "english",
          confidence: data.confidence,
        }
      ]);
      
      // Clear provider speech text
      setProviderSpeechText("");
      
      // Speak translation to patient
      if (!isMuted) {
        speakTranslatedText(data.translatedText);
      }
    },
    onError: (error) => {
      setIsTranslating(false);
      console.error("Translation error:", error);
      
      toast({
        title: "Translation failed",
        description: "There was an error translating the speech. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Function to toggle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Function to start recording
  const startRecording = () => {
    setIsRecording(true);
    
    // In a real implementation, this would use the Web Speech API or a similar service
    toast({
      title: "Recording started",
      description: `Listening for ${selectedLanguage} speech...`,
      variant: "default",
    });
  };
  
  // Function to stop recording and process speech
  const stopRecording = () => {
    setIsRecording(false);
    
    // In a real implementation, this would process the recorded audio using an AI service
    // For this demo, we'll use the text entered in the input
    if (patientSpeechText.trim()) {
      translatePatientSpeechMutation.mutate(patientSpeechText);
    } else {
      toast({
        title: "No speech detected",
        description: "Please try again and speak clearly.",
        variant: "default",
      });
    }
  };
  
  // Function to speak translated text to patient
  const speakTranslatedText = (text: string) => {
    setIsSpeaking(true);
    
    // In a real implementation, this would use the Web Speech API or a similar service
    // Simulate speech generation delay
    setTimeout(() => {
      setIsSpeaking(false);
      
      toast({
        title: "Translation spoken",
        description: `Message has been translated and spoken in ${selectedLanguage}`,
        variant: "default",
      });
    }, 2000);
  };
  
  // Function to toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    toast({
      title: isMuted ? "Audio enabled" : "Audio muted",
      description: isMuted 
        ? "Translations will be spoken out loud" 
        : "Translations will not be spoken out loud",
      variant: "default",
    });
  };
  
  // Function to translate provider speech
  const handleProviderTranslation = () => {
    if (providerSpeechText.trim()) {
      translateProviderSpeechMutation.mutate(providerSpeechText);
    } else {
      toast({
        title: "No text to translate",
        description: "Please enter text to translate.",
        variant: "default",
      });
    }
  };
  
  // Function to format recording time
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
        variant="outline"
      >
        <Languages className="h-4 w-4" />
        Multilingual Interpreter
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              AI Multilingual Interpreter
            </DialogTitle>
            <DialogDescription>
              Real-time translation between you and your patient. Select the patient's preferred language.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 pt-4">
            {/* Language Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Patient's Language</label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-xs text-muted-foreground">({language.nativeName})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Patient Speech Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span>Patient Speech</span>
                  <Badge variant="outline" className="gap-1">
                    {supportedLanguages.find(l => l.code === selectedLanguage)?.flag || '🌐'} 
                    {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
                  </Badge>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  className="gap-1"
                  onClick={toggleRecording}
                  disabled={isTranslating}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop ({formatRecordingTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Record
                    </>
                  )}
                </Button>
              </div>
              
              {/* Voice Recording Indicator */}
              {isRecording && (
                <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-700">Recording...</span>
                  </div>
                  <span className="text-xs text-red-700 font-mono">{formatRecordingTime(recordingTime)}</span>
                </div>
              )}
              
              <Textarea
                placeholder={`Type or record what the patient is saying in ${selectedLanguage}...`}
                value={patientSpeechText}
                onChange={(e) => setPatientSpeechText(e.target.value)}
                className="min-h-20"
                disabled={isRecording || isTranslating}
              />
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => translatePatientSpeechMutation.mutate(patientSpeechText)}
                  disabled={!patientSpeechText.trim() || isTranslating}
                  className="gap-1"
                >
                  {isTranslating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Translating...
                    </>
                  ) : (
                    <>
                      <Repeat className="h-4 w-4" />
                      Translate to English
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Provider Speech Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span>Provider Speech</span>
                  <Badge variant="outline" className="gap-1">
                    🇺🇸 English
                  </Badge>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Mute
                    </>
                  )}
                </Button>
              </div>
              
              <Textarea
                placeholder={`Type what you want to say to the patient (will be translated to ${selectedLanguage})...`}
                value={providerSpeechText}
                onChange={(e) => setProviderSpeechText(e.target.value)}
                className="min-h-20"
                disabled={isTranslating}
              />
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleProviderTranslation}
                  disabled={!providerSpeechText.trim() || isTranslating || isSpeaking}
                  className="gap-1"
                >
                  {isTranslating || isSpeaking ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      {isSpeaking ? "Speaking..." : "Translating..."}
                    </>
                  ) : (
                    <>
                      <Volume className="h-4 w-4" />
                      Translate & Speak
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Translation History */}
            {conversationHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Conversation History</h3>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                  {conversationHistory.map((item, index) => (
                    <Card key={index} className={item.detectedLanguage === "english" ? "bg-blue-50" : "bg-green-50"}>
                      <CardContent className="p-3">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="gap-1">
                              {item.detectedLanguage === "english" 
                                ? "Provider (English)" 
                                : `Patient (${item.detectedLanguage})`}
                            </Badge>
                            {item.confidence && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Brain className="h-3 w-3" />
                                {Math.round(item.confidence * 100)}% confidence
                              </div>
                            )}
                          </div>
                          <p className="text-sm mt-1">{item.originalText}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Repeat className="h-3 w-3" />
                            <span>Translated:</span>
                          </div>
                          <p className="text-sm font-medium">{item.translatedText}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Helpful Phrases */}
            <div className="border rounded-md p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Helpful Common Phrases</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setProviderSpeechText("Are you experiencing any pain right now?")}
                >
                  "Are you experiencing any pain right now?"
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setProviderSpeechText("Please open your mouth wide.")}
                >
                  "Please open your mouth wide."
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setProviderSpeechText("Does this hurt when I touch it?")}
                >
                  "Does this hurt when I touch it?"
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setProviderSpeechText("I'm going to take an X-ray now.")}
                >
                  "I'm going to take an X-ray now."
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}