import { useState, useEffect } from 'react';

const useDentaScopeSocket = (url) => {
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState('');
  const [data, setData] = useState({});

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('Connected to DentaScope WebSocket');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.transcript) {
        setTranscript(message.transcript);
      }
      if (message.context) {
        setContext(message.context);
      }
      setData(message);
    };

    socket.onclose = () => {
      console.log('Disconnected from DentaScope WebSocket');
    };

    return () => {
      socket.close();
    };
  }, [url]);

  return { transcript, context, data };
};

export default useDentaScopeSocket; 