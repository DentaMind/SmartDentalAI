import { db } from '../../server/db';
import { aiTriageResults, aiModelVersions, patientFormRecords } from '../../shared/schema';
import { faker } from '@faker-js/faker';

async function getReadyAndDeployedVersions() {
  const versions = await db.select().from(aiModelVersions);
  const deployed = versions.find((v) => v.status === 'deployed')?.version;
  const ready = versions.find((v) => v.status === 'ready')?.version;
  if (!deployed || !ready) throw new Error('Need both deployed and ready versions');
  return [deployed, ready];
}

async function createFormRecord(patientId: number) {
  const result = await db.insert(patientFormRecords).values({
    patientId,
    formData: {
      chiefComplaint: faker.lorem.sentence(),
      symptoms: {
        pain: faker.datatype.boolean(),
        swelling: faker.datatype.boolean(),
        bleeding: faker.datatype.boolean(),
      }
    },
    status: 'completed',
    createdAt: new Date()
  }).returning({ id: patientFormRecords.id });

  return result[0].id;
}

async function generateTriageRecord(patientId: number, formId: number, version: string) {
  const symptoms = {
    pain: faker.datatype.boolean(),
    swelling: faker.datatype.boolean(),
    bleeding: faker.datatype.boolean(),
  };

  const outcome = faker.helpers.arrayElement(['improved', 'worsened', 'stable']);
  const nextStep = faker.helpers.arrayElement(['recall', 're-eval', 'monitor']);

  await db.insert(aiTriageResults).values({
    formId,
    patientId,
    analysis: {
      symptoms,
      riskFactors: Object.entries(symptoms).filter(([_, v]) => v).map(([k]) => k),
      conditions: symptoms.pain && symptoms.swelling ? ['infection'] : [],
    },
    outcome,
    nextStep,
    modelVersion: version,
    createdAt: new Date(),
  });
}

async function run() {
  const [v1, v2] = await getReadyAndDeployedVersions();
  console.log(`Generating data with models: ${v1} & ${v2}`);
  for (let i = 0; i < 50; i++) {
    const patientId = 1000 + i;
    const formId = await createFormRecord(patientId);
    const version = Math.random() < 0.5 ? v1 : v2;
    await generateTriageRecord(patientId, formId, version);
  }
  console.log('✅ Generated 50 simulated triage records for A/B testing');
}

run().catch(console.error); 