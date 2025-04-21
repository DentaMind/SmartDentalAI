import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  TextField,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { BRANDING } from '../constants/branding';
import { BrandedLoading } from '../components/BrandedLoading';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now(),
        text: `I'm analyzing your request: "${input}"`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: `${BRANDING.colors.primary}05`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: theme.spacing(2),
          backgroundColor: BRANDING.colors.background,
          borderBottom: `1px solid ${BRANDING.colors.primary}22`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(2),
        }}
      >
        <AIIcon
          sx={{
            color: BRANDING.colors.primary,
            fontSize: 28,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontFamily: BRANDING.fonts.secondary,
            color: BRANDING.colors.secondary,
            flexGrow: 1,
          }}
        >
          {BRANDING.name} AI Assistant
        </Typography>
        <IconButton
          onClick={() => {/* Handle close */}}
          sx={{ color: BRANDING.colors.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          padding: theme.spacing(3),
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(2),
        }}
      >
        {messages.map(message => (
          <Fade key={message.id} in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                padding: theme.spacing(2),
                backgroundColor: message.sender === 'ai'
                  ? `${BRANDING.colors.primary}11`
                  : BRANDING.colors.background,
                alignSelf: message.sender === 'ai' ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                borderRadius: theme.shape.borderRadius * 2,
                position: 'relative',
              }}
            >
              <Typography variant="body1">
                {message.text}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: -20,
                  right: message.sender === 'user' ? 0 : 'auto',
                  left: message.sender === 'ai' ? 0 : 'auto',
                  opacity: 0.7,
                }}
              >
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </Fade>
        ))}
        {isTyping && (
          <Box sx={{ padding: theme.spacing(2) }}>
            <BrandedLoading
              type="inline"
              message="AI is thinking..."
              size="small"
              showLogo={false}
            />
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          padding: theme.spacing(2),
          backgroundColor: BRANDING.colors.background,
          borderTop: `1px solid ${BRANDING.colors.primary}22`,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={handleSend}
                disabled={!input.trim()}
                sx={{
                  color: input.trim() ? BRANDING.colors.primary : 'inherit',
                }}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: BRANDING.colors.background,
              '&:hover fieldset': {
                borderColor: BRANDING.colors.primary,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}; 