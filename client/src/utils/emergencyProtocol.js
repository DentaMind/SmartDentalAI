const emergencyProtocol = (alert) => {
  const roles = {
    assistantA: 'Call emergency services and prepare the AED.',
    assistantB: 'Gather patient information and medical history.',
    assistantC: 'Prepare emergency medications and equipment.',
  };

  const actions = [];

  if (alert.includes('heart rate') || alert.includes('oxygen saturation')) {
    actions.push('Activate emergency protocol.');
    actions.push(roles.assistantA);
    actions.push(roles.assistantB);
    actions.push(roles.assistantC);
  }

  return actions;
};

export default emergencyProtocol; 