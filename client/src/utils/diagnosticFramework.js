import axios from 'axios';
import generateDiagnosticExplanation from './gptReasoning';

class DiagnosticFramework {
  constructor() {
    this.modules = {};
  }

  registerModule(name, module) {
    this.modules[name] = module;
  }

  async runDiagnosticModule(name, input) {
    if (!this.modules[name]) {
      throw new Error(`Module ${name} not registered.`);
    }
    const diagnosticOutput = await this.modules[name].run(input);
    const explanation = await generateDiagnosticExplanation(diagnosticOutput.output);
    return { ...diagnosticOutput, explanation };
  }
}

async function runRoboflowCariesDetection(input) {
  const { image, metadata } = input;
  const apiKey = 'YOUR_ROBOFLOW_API_KEY'; // Replace with your actual API key
  const modelEndpoint = 'https://api.roboflow.com/your-model-endpoint'; // Replace with your actual model endpoint

  try {
    const response = await axios.post(modelEndpoint, {
      api_key: apiKey,
      image,
      metadata,
    });

    const predictions = response.data.predictions.map(prediction => ({
      confidence: prediction.confidence,
      location: prediction.location,
      suggestion: prediction.suggestion,
    }));

    return {
      type: 'diagnosis',
      module: 'caries',
      input: 'radiograph',
      output: predictions,
    };
  } catch (error) {
    console.error('Error running Roboflow caries detection:', error);
    throw new Error('Failed to run caries detection');
  }
}

async function runPeriodontalStaging(input) {
  const { pd, rec, cal } = input;
  // Placeholder logic for periodontal staging
  // In a real implementation, this would involve complex calculations
  const stage = 'Stage III';
  const grade = 'Grade B';

  return {
    type: 'diagnosis',
    module: 'periodontal',
    input: 'perio chart',
    output: [{
      stage,
      grade,
      suggestion: `Periodontal condition classified as ${stage} ${grade}.`,
    }],
  };
}

const diagnosticFramework = new DiagnosticFramework();
diagnosticFramework.registerModule('caries', { run: runRoboflowCariesDetection });
diagnosticFramework.registerModule('periodontal', { run: runPeriodontalStaging });

export default diagnosticFramework; 