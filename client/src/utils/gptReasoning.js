import { OpenAI } from 'openai';

const openai = new OpenAI('YOUR_OPENAI_API_KEY'); // Replace with your actual API key

async function generateDiagnosticExplanation(diagnosticOutput) {
  const prompt = `Given the following diagnostic findings, provide a clinical explanation and suggested actions:

${JSON.stringify(diagnosticOutput, null, 2)}

Explanation:`;

  try {
    const response = await openai.Completion.create({
      engine: 'davinci',
      prompt,
      maxTokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating explanation:', error);
    throw new Error('Failed to generate diagnostic explanation');
  }
}

export default generateDiagnosticExplanation; 