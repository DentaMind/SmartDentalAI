import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Mic, MicOff, VideoOff } from "lucide-react";

interface VideoChatProps {
  appointmentId: number;
  isDoctor: boolean;
}

export function VideoChat({ appointmentId, isDoctor }: VideoChatProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>();
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const userVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance>();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });
  }, []);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full h-full">
            <video
              playsInline
              muted
              ref={userVideo}
              autoPlay
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 flex space-x-2">
              <Button
                size="icon"
                variant={isMuted ? "destructive" : "secondary"}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </Button>
              <Button
                size="icon"
                variant={isVideoOff ? "destructive" : "secondary"}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff /> : <Video />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
            {callAccepted ? (
              <video
                playsInline
                ref={partnerVideo}
                autoPlay
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-white text-center">
                <h3 className="text-lg font-medium">Waiting for participant...</h3>
                <p className="text-sm text-gray-400">
                  The other participant hasn't joined yet
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
