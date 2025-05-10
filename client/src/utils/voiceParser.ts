export interface ParsedCommand {
  tooth?: number;
  surface?: 'buccal' | 'lingual' | 'mesial' | 'distal' | 'facial';
  site?: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl';
  measurements?: {
    PD?: number;
    REC?: number;
    CAL?: number;
  };
  command?: 'chart' | 'next' | 'back' | 'repeat';
  error?: string;
}

// Add a mapping for word-to-number conversion
const numberWords: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
  'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
  'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
  'twenty-nine': 29, 'thirty': 30, 'thirty-one': 31, 'thirty-two': 32
};

// Function to convert words to numbers
const convertWordsToNumbers = (input: string): string => {
  return input.split(' ').map(word => numberWords[word] || word).join(' ');
};

// Function to extract numbers from informal phrases
const extractNumbers = (input: string): number[] => {
  const numberPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|\d+)\b/gi;
  const matches = input.match(numberPattern);
  return matches ? matches.map(match => numberWords[match.toLowerCase()] || parseInt(match, 10)) : [];
};

// Function to map extracted numbers to specific sites
const mapToSites = (values: number[]): Record<string, number> => {
  const sites = ['distobuccal', 'midbuccal', 'mesiobuccal'];
  return values.reduce((acc, value, index) => {
    if (index < sites.length) {
      acc[sites[index]] = value;
    }
    return acc;
  }, {} as Record<string, number>);
};

export async function parseVoiceCommand(transcript: string): Promise<ParsedCommand> {
  const normalized = normalize(transcript.trim().toLowerCase());
  const converted = convertWordsToNumbers(normalized);

  // ✅ Simple commands
  if (converted.includes('next')) return { command: 'next' };
  if (converted.includes('back')) return { command: 'back' };
  if (converted.includes('repeat')) return { command: 'repeat' };

  try {
    // ✅ Tooth number (1-32)
    const toothMatch = converted.match(/tooth (\d{1,2})/);
    const tooth = toothMatch ? parseInt(toothMatch[1], 10) : undefined;

    // Remove the tooth number from the string to prevent it from being included in measurements
    const withoutTooth = toothMatch ? converted.replace(toothMatch[0], '') : converted;

    // ✅ Surface
    const surfaceMatch = withoutTooth.match(/(buccal|lingual)/);
    const surface = surfaceMatch?.[1];

    // ✅ Probing depth group
    const pdValues = extractNumbers(withoutTooth.match(/probing depth (?:is )?([\w\s]+)/)?.[1] || '');
    const pdSites = mapToSites(pdValues);

    // ✅ Recession
    const recValues = extractNumbers(withoutTooth.match(/recession (?:is )?([\w\s]+)/)?.[1] || '');
    const recSites = mapToSites(recValues);

    // ✅ Attachment loss
    const calValues = extractNumbers(withoutTooth.match(/attachment loss (?:is )?([\w\s]+)/)?.[1] || '');
    const calSites = mapToSites(calValues);

    // ✅ Mobility
    const mobilityMatch = withoutTooth.match(/mobility class (\d+)/);
    const mobility = mobilityMatch ? parseInt(mobilityMatch[1], 10) : undefined;

    // ✅ Furcation
    const furcationMatch = withoutTooth.match(/furcation class (\d+)/);
    const furcation = furcationMatch ? parseInt(furcationMatch[1], 10) : undefined;

    const hasAnyMeasurement = pdValues.length > 0 || recValues.length > 0 || calValues.length > 0 || mobility !== undefined || furcation !== undefined;

    if (tooth && surface && hasAnyMeasurement) {
      return {
        command: 'chart',
        tooth,
        surface,
        measurements: {
          PD: pdSites,
          REC: recSites,
          CAL: calSites,
          Mobility: mobility,
          Furcation: furcation,
        },
      };
    }

    // ❌ If regex didn't fully catch everything — try fallback
    return await parseWithNLP(transcript);
  } catch (err) {
    return { command: 'chart', error: 'Could not parse command' };
  }
}

async function parseWithNLP(transcript: string): Promise<ParsedCommand> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a voice command parser for a dental perio charting assistant. Extract and return the command type ("chart", "next", "back", "repeat"), tooth number (1–32), surface ("buccal" or "lingual"), and measurements (probing depth, recession, attachment loss) as a structured JSON.',
        },
        {
          role: 'user',
          content: `Transcribed voice input: "${transcript}"`,
        },
      ],
      temperature: 0,
    });

    const text = response.choices[0].message.content;

    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid GPT response');

    const parsed: ParsedCommand = JSON.parse(jsonMatch[0]);

    // Post-validate the parsed output
    if (!parsed.command || !['chart', 'next', 'back', 'repeat'].includes(parsed.command)) {
      throw new Error('Invalid command type');
    }

    return parsed;
  } catch (err) {
    console.error('NLP Fallback failed:', err);
    return { command: 'chart', error: 'Voice input unclear. Try again.' };
  }
}

function wordToNumber(word: string): number {
  const wordsToNumbers: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
    'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
    'twenty-nine': 29, 'thirty': 30, 'thirty-one': 31, 'thirty-two': 32
  };
  return wordsToNumbers[word.toLowerCase()] || 0;
} 