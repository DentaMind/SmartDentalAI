export const mockBenefitsData = {
  benefits: [
    {
      type: 'Annual Maximum',
      used: 750,
      remaining: 1250,
      total: 2000,
      nextRenewal: '2025-01-01',
    },
    {
      type: 'Preventive',
      used: 200,
      remaining: 300,
      total: 500,
      nextRenewal: '2025-01-01',
    },
    {
      type: 'Orthodontic Lifetime',
      used: 1000,
      remaining: 1500,
      total: 2500,
      nextRenewal: '2025-01-01',
    },
  ],
  coverage: [
    {
      cdtCode: 'D2740',
      description: 'Crown - Porcelain/Ceramic',
      coveragePercent: 50,
      requiresPreAuth: true,
      warnings: [
        'Frequency limitation: 1 every 5 years',
        'Previous crown placed on 2020-03-15',
      ],
    },
    {
      cdtCode: 'D1110',
      description: 'Prophylaxis - Adult',
      coveragePercent: 100,
      requiresPreAuth: false,
      warnings: [],
    },
    {
      cdtCode: 'D0274',
      description: 'Bitewings - Four Films',
      coveragePercent: 80,
      requiresPreAuth: false,
      warnings: ['Frequency limitation: 1 every 6 months'],
    },
  ],
}; 