import React from 'react';
import { render, screen } from '@testing-library/react';
import DentaMindLogo from '../DentaMindLogo';

describe('DentaMindLogo Component', () => {
  test('renders the logo correctly', () => {
    render(<DentaMindLogo />);
    const logoElement = screen.getByAltText('DentaMind Logo');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement.tagName).toBe('IMG');
    expect(logoElement.getAttribute('src')).toBe('/assets/dentamind-face-logo.svg');
  });
}); 