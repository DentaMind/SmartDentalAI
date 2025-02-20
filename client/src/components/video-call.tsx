import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SimplePeer from "simple-peer";

type VideoCallProps = {
  appointmentId: number;
};

export default function VideoCall({ appointmentId }: VideoCallProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance>();
  const streamRef = useRef<MediaStream>();

  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Mock connection setup - in real app would connect to WebSocket server
        setTimeout(() => {
          setIsConnecting(false);
          toast({
            title: "Connected",
            description: "Video call session is ready",
          });
        }, 2000);

      } catch (error) {
        console.error("Failed to get media devices:", error);
        toast({
          title: "Camera/Microphone Error",
          description: "Failed to access media devices",
          variant: "destructive",
        });
      }
    }

    setupMedia();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.destroy();
    };
  }, [toast]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <Card className="relative">
      <CardContent className="p-0 aspect-video">
        {isConnecting ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Connecting to appointment #{appointmentId}...</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-background shadow-lg"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute bottom-4 left-4 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
