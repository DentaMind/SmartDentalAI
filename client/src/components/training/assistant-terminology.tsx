import React from "react";
import { Card } from "@/components/ui/card";

const dentalTerms = [
  {
    category: "Tooth Surfaces",
    terms: [
      { term: "Mesial", definition: "The surface of the tooth closest to the midline (center) of the mouth." },
      { term: "Distal", definition: "The surface of the tooth farthest from the midline of the mouth." },
      { term: "Buccal", definition: "The surface of the posterior teeth that faces the cheeks." },
      { term: "Lingual", definition: "The surface of the tooth that faces the tongue." },
      { term: "Occlusal", definition: "The chewing surface of posterior teeth." },
      { term: "Incisal", definition: "The biting edge of anterior teeth." }
    ]
  },
  {
    category: "Procedures",
    terms: [
      { term: "Prophylaxis", definition: "A routine dental cleaning to remove plaque and calculus." },
      { term: "Restoration", definition: "A filling used to restore a decayed tooth." },
      { term: "Crown", definition: "A tooth-shaped cap placed over a tooth to restore its shape, size, and strength." },
      { term: "Root Canal", definition: "A procedure to remove infected pulp from inside the tooth." },
      { term: "Extraction", definition: "Removal of a tooth from the mouth." }
    ]
  },
  {
    category: "Scheduling",
    terms: [
      { term: "Recall", definition: "A scheduled follow-up visit for a patient's routine check-up and cleaning." },
      { term: "Same-day Treatment", definition: "Offering procedures during the patient's initial appointment when possible." },
      { term: "No-show", definition: "A patient who misses an appointment without notifying the office." },
      { term: "Block Scheduling", definition: "A method of organizing appointments to maximize provider efficiency." }
    ]
  },
  {
    category: "Probing & Periodontal Terms",
    terms: [
      { term: "Probing Depth", definition: "Measurement of the space between the tooth and gum, used to assess periodontal health." },
      { term: "BOP (Bleeding on Probing)", definition: "Bleeding that occurs when probing the gums — a sign of inflammation." },
      { term: "CAL (Clinical Attachment Loss)", definition: "Loss of tissue connecting the tooth to the bone — an indicator of gum disease." },
      { term: "Pocket", definition: "A deep space between tooth and gum often due to periodontitis." }
    ]
  }
];

export default function AssistantTerminology() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dental Terminology Reference</h1>
      {dentalTerms.map((section, idx) => (
        <Card key={idx} className="p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">{section.category}</h2>
          <ul className="space-y-2">
            {section.terms.map((item, index) => (
              <li key={index} className="border-b pb-2">
                <strong>{item.term}</strong>: {item.definition}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}