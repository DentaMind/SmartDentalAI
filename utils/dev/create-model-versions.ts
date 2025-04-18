import { db } from '../../server/db';
import { aiModelVersions } from '../../shared/schema';

async function createModelVersions() {
  // Create a deployed version
  await db.insert(aiModelVersions).values({
    version: '1.0.0',
    status: 'deployed',
    training_data: {
      samples: 1000,
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88
    },
    metrics: {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88
    },
    deployed_at: new Date(),
    deployed_by: 1 // Assuming user ID 1 exists
  });

  // Create a ready version
  await db.insert(aiModelVersions).values({
    version: '1.1.0',
    status: 'ready',
    training_data: {
      samples: 1200,
      accuracy: 0.88,
      precision: 0.85,
      recall: 0.91
    },
    metrics: {
      accuracy: 0.88,
      precision: 0.85,
      recall: 0.91
    },
    created_at: new Date()
  });

  console.log('✅ Created model versions for A/B testing');
}

createModelVersions().catch(console.error); 