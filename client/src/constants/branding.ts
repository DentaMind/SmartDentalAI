export const BRANDING = {
  name: 'DentaMind',
  tagline: 'Simplifying Complexity in Every Case',
  logo: {
    full: '/assets/branding/FullLogo.jpg',
    text: '/assets/branding/TextOnly.png',
    letterhead: '/assets/branding/design.png',
  },
  splashAnimation: '/assets/branding/video_full.mp4',
  colors: {
    primary: '#4CAF50', // Green from the logo
    secondary: '#000000', // Black for text
    background: '#FFFFFF', // White background
    accent: '#E0E0E0', // Light gray for accents
  },
  fonts: {
    primary: '"Roboto", "Helvetica", "Arial", sans-serif',
    secondary: '"Montserrat", "Helvetica", "Arial", sans-serif',
  },
  email: {
    footerTemplate: (adminName: string, adminId: string) => `
      Best regards,
      ${adminName}
      Admin ID: ${adminId}
      DentaMind - Simplifying Complexity in Every Case
    `
  }
}; 