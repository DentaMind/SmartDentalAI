import React from 'react';
import { useBrand, Logo } from './BrandProvider';
import BrandButton from './BrandButton';
import BrandCard from './BrandCard';
import BrandedSpinner from './BrandedSpinner';
import ThemeSwitcher from './ThemeSwitcher';
import AiInsightBadge from '../ai/AiInsightBadge';

interface BrandShowcaseProps {
  title?: string;
}

/**
 * A component that showcases all the branded UI components
 * This is useful for documentation and testing
 */
const BrandShowcase: React.FC<BrandShowcaseProps> = ({
  title = 'DentaMind UI Components',
}) => {
  const { colors, typography, mode } = useBrand();

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ color: colors.textPrimary }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={typography.h1}>{title}</h1>
        <ThemeSwitcher showLabel size="lg" />
      </div>

      {/* Branding Section */}
      <section className="mb-12">
        <h2 className={typography.h2} style={{ color: colors.primary }}>Brand Assets</h2>
        <div className="bg-opacity-5 rounded-lg p-6 mb-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>Logo Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <Logo type="full" size="lg" />
              <p className="mt-3">Full Logo</p>
            </div>
            <div className="flex flex-col items-center">
              <Logo type="icon" size="lg" />
              <p className="mt-3">Icon Only</p>
            </div>
            <div className="flex flex-col items-center">
              <Logo type="text" size="lg" />
              <p className="mt-3">Text Only</p>
            </div>
          </div>
        </div>

        <div className="bg-opacity-5 rounded-lg p-6 mb-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>Color Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="h-16 rounded-md" style={{ backgroundColor: colors.primary }}></div>
              <p className="mt-2">Primary</p>
              <code className="text-xs">{colors.primary}</code>
            </div>
            <div className="flex flex-col">
              <div className="h-16 rounded-md" style={{ backgroundColor: colors.primaryDark }}></div>
              <p className="mt-2">Primary Dark</p>
              <code className="text-xs">{colors.primaryDark}</code>
            </div>
            <div className="flex flex-col">
              <div className="h-16 rounded-md" style={{ backgroundColor: colors.bgDark }}></div>
              <p className="mt-2">Background Dark</p>
              <code className="text-xs">{colors.bgDark}</code>
            </div>
            <div className="flex flex-col">
              <div className="h-16 rounded-md" style={{ backgroundColor: colors.bgMedium }}></div>
              <p className="mt-2">Background Medium</p>
              <code className="text-xs">{colors.bgMedium}</code>
            </div>
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className="mb-12">
        <h2 className={typography.h2} style={{ color: colors.primary }}>UI Components</h2>
        
        {/* Buttons */}
        <div className="bg-opacity-5 rounded-lg p-6 mb-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>Buttons</h3>
          
          <div className="mb-6">
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Button Variants</h4>
            <div className="flex flex-wrap gap-4">
              <BrandButton variant="primary">Primary</BrandButton>
              <BrandButton variant="secondary">Secondary</BrandButton>
              <BrandButton variant="outline">Outline</BrandButton>
              <BrandButton variant="ghost">Ghost</BrandButton>
              <BrandButton variant="danger">Danger</BrandButton>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Button Sizes</h4>
            <div className="flex flex-wrap items-center gap-4">
              <BrandButton size="xs">Extra Small</BrandButton>
              <BrandButton size="sm">Small</BrandButton>
              <BrandButton size="md">Medium</BrandButton>
              <BrandButton size="lg">Large</BrandButton>
            </div>
          </div>
          
          <div>
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Button States</h4>
            <div className="flex flex-wrap gap-4">
              <BrandButton>Default</BrandButton>
              <BrandButton disabled>Disabled</BrandButton>
              <BrandButton loading>Loading</BrandButton>
            </div>
          </div>
        </div>
        
        {/* Cards */}
        <div className="bg-opacity-5 rounded-lg p-6 mb-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>Cards</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BrandCard
              title="Default Card"
              subtitle="Basic card example"
              footer={<div className="text-right"><BrandButton size="sm">Action</BrandButton></div>}
            >
              <p>This is a standard card with a title, subtitle, and footer.</p>
            </BrandCard>
            
            <BrandCard
              variant="elevated"
              title="Elevated Card"
              subtitle="With shadow"
            >
              <p>This card has an elevated appearance with shadow.</p>
            </BrandCard>
            
            <BrandCard
              variant="outlined"
              title="Outlined Card"
              subtitle="With primary border"
            >
              <p>This card has a prominent border in the primary color.</p>
            </BrandCard>
            
            <BrandCard
              variant="highlighted"
              title="Highlighted Card"
              subtitle="Dark theme card"
              footer={<div className="text-right"><BrandButton size="sm" variant="outline">Action</BrandButton></div>}
            >
              <p>This card uses a dark theme with light text for emphasis.</p>
            </BrandCard>
          </div>
        </div>
        
        {/* AI Insight Badges */}
        <div className="bg-opacity-5 rounded-lg p-6 mb-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>AI Insight Badges</h3>
          
          <div className="mb-6">
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Types</h4>
            <div className="flex flex-wrap gap-4">
              <AiInsightBadge 
                confidence={95} 
                insight="Posterior Caries Detected" 
                detailedExplanation="AI detected radiolucency consistent with caries on the distal surface of tooth #30."
                type="diagnosis"
              />
              <AiInsightBadge 
                confidence={85} 
                insight="Recommend Composite Restoration" 
                detailedExplanation="Based on the size and location of the caries, a composite restoration is recommended."
                type="treatment"
              />
              <AiInsightBadge 
                confidence={78} 
                insight="Reconsider Recall Interval" 
                detailedExplanation="Patient has high caries risk. Consider reducing recall interval from 6 to 3 months."
                type="alert"
              />
              <AiInsightBadge 
                confidence={92} 
                insight="Missing Previous Treatment" 
                detailedExplanation="Previously recommended treatment for tooth #19 is not completed."
                type="info"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Confidence Levels</h4>
            <div className="flex flex-wrap gap-4">
              <AiInsightBadge 
                confidence={98} 
                insight="High Confidence" 
                detailedExplanation="Very high confidence in this diagnosis based on multiple indicators."
              />
              <AiInsightBadge 
                confidence={75} 
                insight="Medium Confidence" 
                detailedExplanation="Moderate confidence in this assessment."
              />
              <AiInsightBadge 
                confidence={45} 
                insight="Low Confidence" 
                detailedExplanation="Lower confidence, human verification strongly advised."
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>In Clinical Context</h4>
            <BrandCard
              title="Tooth #30 Diagnosis"
              subtitle="Last updated: Today at 2:45 PM"
              footer={
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Hover over badges for details</span>
                  <BrandButton size="sm" variant="primary">Accept Findings</BrandButton>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Posterior Distal Caries</span>
                  </div>
                  <AiInsightBadge 
                    confidence={94} 
                    insight="Distal Caries Detected" 
                    detailedExplanation="AI detected radiolucency consistent with caries on the distal surface of tooth #30. The lesion appears to be approaching the dentin."
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Class II Restoration Needed</span>
                  </div>
                  <AiInsightBadge 
                    confidence={88} 
                    insight="Class II Composite Recommended" 
                    detailedExplanation="Based on caries size and location, a Class II composite restoration is recommended. Estimated time: 45 minutes."
                    type="treatment"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Potential Pulpal Involvement</span>
                  </div>
                  <AiInsightBadge 
                    confidence={45} 
                    insight="Potential Pulp Exposure" 
                    detailedExplanation="Low confidence detection suggests possible pulpal involvement. Recommend clinical examination prior to restoration."
                    type="alert"
                  />
                </div>
              </div>
            </BrandCard>
          </div>
          
          <div>
            <h4 className={typography.h4} style={{ marginBottom: '0.75rem' }}>Sizes</h4>
            <div className="flex flex-wrap items-center gap-4">
              <AiInsightBadge 
                size="sm"
                confidence={90} 
                insight="Small Size" 
                detailedExplanation="Small badge for tight spaces."
              />
              <AiInsightBadge 
                size="md"
                confidence={90} 
                insight="Medium Size" 
                detailedExplanation="Default medium-sized badge."
              />
              <AiInsightBadge 
                size="lg"
                confidence={90} 
                insight="Large Size" 
                detailedExplanation="Large badge for emphasis."
              />
            </div>
          </div>
        </div>
        
        {/* Spinners */}
        <div className="bg-opacity-5 rounded-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h3 className={typography.h3} style={{ marginBottom: '1rem' }}>Spinners</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <BrandedSpinner size="md" variant="primary" label="Loading..." />
              <p className="mt-3">Primary</p>
            </div>
            <div className="flex flex-col items-center" style={{ backgroundColor: colors.bgDark, padding: '1rem', borderRadius: '0.5rem' }}>
              <BrandedSpinner size="md" variant="light" label="Loading..." />
              <p className="mt-3" style={{ color: colors.textLight }}>Light</p>
            </div>
            <div className="flex flex-col items-center" style={{ backgroundColor: mode === 'dark' ? colors.textLight : '#f5f5f5', padding: '1rem', borderRadius: '0.5rem' }}>
              <BrandedSpinner size="md" variant="dark" label="Loading..." />
              <p className="mt-3" style={{ color: colors.bgDark }}>Dark</p>
            </div>
            <div className="flex flex-col items-center">
              <BrandedSpinner size="xs" variant="primary" label="XS" />
              <BrandedSpinner size="sm" variant="primary" label="SM" />
              <BrandedSpinner size="md" variant="primary" label="MD" />
              <BrandedSpinner size="lg" variant="primary" label="LG" />
              <p className="mt-3">Sizes</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Typography Section */}
      <section>
        <h2 className={typography.h2} style={{ color: colors.primary }}>Typography</h2>
        <div className="bg-opacity-5 rounded-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <h1 className={typography.h1}>Heading 1</h1>
          <h2 className={typography.h2}>Heading 2</h2>
          <h3 className={typography.h3}>Heading 3</h3>
          <h4 className={typography.h4}>Heading 4</h4>
          <h5 className={typography.h5}>Heading 5</h5>
          <p className={typography.body}>Body Text - The quick brown fox jumps over the lazy dog.</p>
          <p className={typography.small}>Small Text - The quick brown fox jumps over the lazy dog.</p>
          <p className={typography.tiny}>Tiny Text - The quick brown fox jumps over the lazy dog.</p>
        </div>
      </section>
    </div>
  );
};

export default BrandShowcase; 