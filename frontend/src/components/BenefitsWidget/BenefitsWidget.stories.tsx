import type { Meta, StoryObj } from '@storybook/react';
import { BenefitsWidget } from './';
import { mockBenefitsData } from './mockData';

// Mock the fetch function
const mockFetch = (mockData: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData),
    })
  ) as jest.Mock;
};

// Reset fetch mock before each story
beforeEach(() => {
  mockFetch(mockBenefitsData);
});

const meta: Meta<typeof BenefitsWidget> = {
  title: 'Components/BenefitsWidget',
  component: BenefitsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BenefitsWidget>;

export const Default: Story = {
  args: {
    patientId: '123',
  },
};

export const Loading: Story = {
  args: {
    patientId: '123',
  },
  parameters: {
    mockData: {
      loading: true,
    },
  },
};

export const Error: Story = {
  args: {
    patientId: '123',
  },
  parameters: {
    mockData: {
      error: 'Failed to load benefits data',
    },
  },
}; 