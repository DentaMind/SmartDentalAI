import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Search as SearchIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { EmailService } from '../services/emailService';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  category: string;
  priority: string;
  attachments: string[];
}

const EmailInbox: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await EmailService.getEmails();
      setEmails(response.emails);
    } catch (err) {
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleStarEmail = async (emailId: string) => {
    try {
      await EmailService.toggleStar(emailId);
      setEmails(emails.map(email => 
        email.id === emailId 
          ? { ...email, isStarred: !email.isStarred }
          : email
      ));
    } catch (err) {
      setError('Failed to update email status');
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      await EmailService.deleteEmail(emailId);
      setEmails(emails.filter(email => email.id !== emailId));
    } catch (err) {
      setError('Failed to delete email');
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      await EmailService.markAsRead(emailId);
      setEmails(emails.map(email => 
        email.id === emailId 
          ? { ...email, isRead: true }
          : email
      ));
    } catch (err) {
      setError('Failed to update email status');
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || email.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Chip
          icon={<LabelIcon />}
          label="All Categories"
          onClick={() => setSelectedCategory(null)}
          color={!selectedCategory ? 'primary' : 'default'}
          variant={!selectedCategory ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<LabelIcon />}
          label="Patient"
          onClick={() => setSelectedCategory('patient')}
          color={selectedCategory === 'patient' ? 'primary' : 'default'}
          variant={selectedCategory === 'patient' ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<LabelIcon />}
          label="Insurance"
          onClick={() => setSelectedCategory('insurance')}
          color={selectedCategory === 'insurance' ? 'primary' : 'default'}
          variant={selectedCategory === 'insurance' ? 'filled' : 'outlined'}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {filteredEmails.map((email, index) => (
            <React.Fragment key={email.id}>
              <ListItem
                button
                onClick={() => handleMarkAsRead(email.id)}
                sx={{
                  backgroundColor: email.isRead ? 'inherit' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarEmail(email.id);
                    }}
                  >
                    {email.isStarred ? <StarIcon color="primary" /> : <StarBorderIcon />}
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: email.isRead ? 'normal' : 'bold' }}
                      >
                        {email.from}
                      </Typography>
                      <Chip
                        size="small"
                        label={email.priority}
                        color={getPriorityColor(email.priority)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        component="span"
                        sx={{ fontWeight: email.isRead ? 'normal' : 'bold' }}
                      >
                        {email.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mt: 0.5 }}
                      >
                        {email.body.substring(0, 100)}...
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(email.date), 'MMM d, h:mm a')}
                    </Typography>
                    <IconButton edge="end" onClick={() => handleDeleteEmail(email.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton edge="end">
                      <ReplyIcon />
                    </IconButton>
                    <IconButton edge="end">
                      <ForwardIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredEmails.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EmailInbox; 