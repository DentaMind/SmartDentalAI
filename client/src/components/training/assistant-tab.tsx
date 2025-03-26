import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const assistantModules = [
  {
    title: "Instrument Sterilization",
    description: "Step-by-step guide on cleaning, bagging, and autoclaving instruments.",
    steps: [
      "Pre-soak instruments in enzymatic solution.",
      "Scrub, rinse, and dry all instruments thoroughly.",
      "Bag with indicator strip and label with date.",
      "Place in autoclave and select appropriate cycle.",
      "Log sterilization cycle in tracking sheet (date/time/load ID)."
    ],
    image: "/images/sterilization.png",
    quiz: [
      {
        question: "What should you do first when handling dirty instruments?",
        options: ["Bag them", "Autoclave them", "Pre-soak in enzymatic solution", "Rinse with bleach"],
        answer: "Pre-soak in enzymatic solution"
      },
      {
        question: "Why is it important to dry instruments before autoclaving?",
        options: ["To save time", "To prevent water spots", "To prevent corrosion", "Water interferes with sterilization"],
        answer: "Water interferes with sterilization"
      },
      {
        question: "What information should be included on instrument bags?",
        options: ["Price", "Date only", "Date and load number", "Patient name"],
        answer: "Date and load number"
      },
      {
        question: "How should you handle sharp instruments?",
        options: ["With bare hands", "With utility gloves", "Only by the handles", "Only with cassettes"],
        answer: "With utility gloves"
      },
      {
        question: "What is the purpose of the indicator strip?",
        options: ["Decoration", "Verifies sterilization", "Shows expiration", "Identifies the instrument"],
        answer: "Verifies sterilization"
      },
      {
        question: "How often should the autoclave be tested with biological indicators?",
        options: ["Weekly", "Monthly", "Daily", "Yearly"],
        answer: "Weekly"
      },
      {
        question: "What temperature is typically used for sterilization in an autoclave?",
        options: ["120°F", "212°F", "270°F", "350°F"],
        answer: "270°F"
      },
      {
        question: "How long should instruments be soaked in enzymatic solution?",
        options: ["30 seconds", "1 minute", "At least 10-15 minutes", "1 hour"],
        answer: "At least 10-15 minutes"
      },
      {
        question: "How should sterilized instruments be stored?",
        options: ["In a drawer", "In a clean, dry area", "On the counter", "In the sink"],
        answer: "In a clean, dry area"
      },
      {
        question: "What should you do if you notice an instrument is damaged?",
        options: ["Use it anyway", "Hide it", "Report it and remove from circulation", "Fix it yourself"],
        answer: "Report it and remove from circulation"
      }
    ]
  },
  {
    title: "Emergency Response",
    description: "Protocol for handling medical and dental emergencies in the clinic.",
    steps: [
      "Know the location of emergency kits, AED, and oxygen.",
      "Call for help immediately and alert the doctor.",
      "Position patient appropriately based on emergency type.",
      "Assist in administering oxygen, glucose, or epinephrine as directed.",
      "Document the incident after stabilization and report it to the supervisor."
    ],
    image: "/images/emergency_response.png",
    quiz: [
      {
        question: "Where should you look for emergency supplies like an AED or oxygen?",
        options: ["Sterilization area", "Front desk", "Designated emergency supply area", "Doctor's office"],
        answer: "Designated emergency supply area"
      },
      {
        question: "If a patient faints, what is the first step you should take?",
        options: ["Administer glucose", "Call 911 immediately", "Lower the chair back and elevate legs", "Splash water on face"],
        answer: "Lower the chair back and elevate legs"
      },
      {
        question: "Which of the following is used for anaphylaxis?",
        options: ["Oxygen", "Epinephrine", "Aspirin", "Glucose"],
        answer: "Epinephrine"
      },
      {
        question: "Who should be notified immediately during any medical emergency?",
        options: ["Dental assistant", "Front desk", "Supervisor or Doctor", "Patient's family"],
        answer: "Supervisor or Doctor"
      },
      {
        question: "When should documentation of the incident take place?",
        options: ["Before the emergency is resolved", "While waiting for help", "After the situation is stabilized", "Only if the patient asks"],
        answer: "After the situation is stabilized"
      },
      {
        question: "What is the most important first action in any emergency?",
        options: ["Administer treatment", "Start CPR", "Call for help and alert others", "Check insurance"],
        answer: "Call for help and alert others"
      },
      {
        question: "What should you do if a patient has a nosebleed during treatment?",
        options: ["Lean them back and pinch nose", "Have them lean forward and pinch nose", "Give them gauze to chew", "Call 911"],
        answer: "Have them lean forward and pinch nose"
      },
      {
        question: "What should you always do before administering any emergency medication?",
        options: ["Check expiration date", "Ask another assistant", "Mix it", "Ask the front desk"],
        answer: "Check expiration date"
      },
      {
        question: "In the case of a seizure, what should you avoid doing?",
        options: ["Protect the head", "Call for help", "Put something in their mouth", "Remove nearby hazards"],
        answer: "Put something in their mouth"
      },
      {
        question: "How often should the emergency kit be checked for expired items?",
        options: ["Monthly", "Annually", "Weekly", "Never"],
        answer: "Monthly"
      }
    ]
  },
  {
    title: "Radiograph Technique",
    description: "ADA-compliant procedures for capturing diagnostic-quality intraoral radiographs while maintaining HIPAA-safe patient handling.",
    steps: [
      "Verify patient identity and explain the procedure (without disclosing sensitive PHI in public areas).",
      "Select appropriate sensor size based on age and arch.",
      "Position the patient with occlusal plane parallel to the floor.",
      "Use Rinn or XCP holders for precise alignment and safety.",
      "Follow ADA guidelines for angulation and head positioning.",
      "Minimize retakes — check placement before exposure.",
      "Always document in the patient's chart when a radiograph is taken, and why."
    ],
    image: "/images/radiographs.png",
    quiz: [
      {
        question: "Why should you verify patient identity before taking radiographs?",
        options: ["To avoid billing errors", "To match insurance details", "To ensure HIPAA compliance and correct charting", "To choose the right film"],
        answer: "To ensure HIPAA compliance and correct charting"
      },
      {
        question: "What does the ADA recommend for occlusal plane positioning?",
        options: ["45-degree tilt", "Parallel to the floor", "Vertical alignment", "Lying back in full recline"],
        answer: "Parallel to the floor"
      },
      {
        question: "What tool ensures accurate angulation and placement?",
        options: ["Cotton roll", "Bite block", "Rinn/XCP holder", "Digital sensor"],
        answer: "Rinn/XCP holder"
      },
      {
        question: "Why is it important to minimize retakes?",
        options: ["To save time", "To reduce radiation exposure and follow ALARA principles", "To avoid embarrassment", "To reduce film waste"],
        answer: "To reduce radiation exposure and follow ALARA principles"
      },
      {
        question: "What should you do immediately after taking a radiograph?",
        options: ["Delete it", "Show the patient", "Document in the patient's chart", "Call the insurance"],
        answer: "Document in the patient's chart"
      },
      {
        question: "Which sensor size is usually used for pediatric patients?",
        options: ["Size 1", "Size 2", "Size 3", "Size 0"],
        answer: "Size 0"
      },
      {
        question: "How should you handle patient PHI when discussing X-rays?",
        options: ["Only in private areas or operatories", "At front desk", "With family present", "In waiting room if quiet"],
        answer: "Only in private areas or operatories"
      },
      {
        question: "What happens if a patient refuses X-rays?",
        options: ["Ignore it", "Document refusal and inform doctor", "Force them to comply", "Cancel appointment"],
        answer: "Document refusal and inform doctor"
      },
      {
        question: "What is the first step before taking radiographs?",
        options: ["Put on gloves", "Explain the procedure", "Check the machine", "Turn off lights"],
        answer: "Explain the procedure"
      },
      {
        question: "What is ALARA?",
        options: ["A radiograph type", "A law", "An exposure technique", "A radiation safety principle: As Low As Reasonably Achievable"],
        answer: "A radiation safety principle: As Low As Reasonably Achievable"
      }
    ]
  },
  {
    title: "Chair Positioning & Ergonomics",
    description: "Guidelines for correct patient and assistant positioning during dental procedures to minimize strain and enhance visibility.",
    steps: [
      "Ensure the patient's occlusal plane is parallel to the floor for most procedures.",
      "Adjust chair height so the doctor's elbows are at a 90-degree angle.",
      "Use the assistant stool with back support and armrest correctly.",
      "Position the operatory light at 45 degrees to reduce glare and shadows.",
      "Avoid twisting or overreaching — reposition yourself or the patient as needed."
    ],
    image: "/images/chair_positioning.png",
    quiz: [
      {
        question: "What should the patient's occlusal plane be aligned with?",
        options: ["45 degrees to the floor", "Parallel to the floor", "Tilted forward", "Slightly reclined"],
        answer: "Parallel to the floor"
      },
      {
        question: "At what angle should the dentist's elbows be during treatment?",
        options: ["60 degrees", "90 degrees", "120 degrees", "45 degrees"],
        answer: "90 degrees"
      },
      {
        question: "What is the proper use of the assistant stool?",
        options: ["Use without back support", "Sit upright with back and arm support engaged", "Lean forward for better view", "Stand beside the stool"],
        answer: "Sit upright with back and arm support engaged"
      },
      {
        question: "How should the operatory light be positioned?",
        options: ["Directly above the patient's face", "At a 90-degree angle", "At 45 degrees to minimize shadows", "On the assistant's side"],
        answer: "At 45 degrees to minimize shadows"
      },
      {
        question: "What should you avoid to prevent musculoskeletal strain?",
        options: ["Reaching over the patient", "Adjusting chair height", "Using back support", "Repositioning patient"],
        answer: "Reaching over the patient"
      },
      {
        question: "When is it acceptable to twist your body to reach instruments?",
        options: ["Only during emergencies", "Never — reposition instead", "If you stretch first", "When the doctor asks you to"],
        answer: "Never — reposition instead"
      },
      {
        question: "How high should the assistant be seated compared to the doctor?",
        options: ["At the same height", "4-6 inches above the doctor", "Below the doctor", "Standing height"],
        answer: "4-6 inches above the doctor"
      },
      {
        question: "What should you do if visibility is poor due to patient positioning?",
        options: ["Move your head around", "Ask the patient to adjust", "Reposition the light and chair", "Lean further in"],
        answer: "Reposition the light and chair"
      },
      {
        question: "Why is proper ergonomics important for assistants?",
        options: ["It helps you work faster", "Prevents injury and fatigue", "Makes you look professional", "Avoids getting fired"],
        answer: "Prevents injury and fatigue"
      },
      {
        question: "What role does chair positioning play in dental treatment?",
        options: ["None", "Only for comfort", "It impacts visibility, access, and patient comfort", "Only matters in hygiene visits"],
        answer: "It impacts visibility, access, and patient comfort"
      }
    ]
  }
];

export default function AssistantTab() {
  const [quizResults, setQuizResults] = useState({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const handleQuizSubmit = (title: string, score: number) => {
    setQuizResults(prev => ({ ...prev, [title]: score }));
  };

  // Calculate overall progress
  const completedModules = Object.keys(quizResults).filter(
    module => quizResults[module] >= 90
  ).length;
  
  const progressPercentage = (completedModules / assistantModules.length) * 100;

  const toggleModule = (title: string) => {
    if (expandedModule === title) {
      setExpandedModule(null);
    } else {
      setExpandedModule(title);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50">
        <h2 className="text-lg font-semibold mb-2">Training Progress</h2>
        <div className="mb-2">
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <p className="text-sm">
          {completedModules} of {assistantModules.length} modules completed ({Math.round(progressPercentage)}%)
        </p>
      </Card>

      <div className="grid gap-6">
        {assistantModules.map((module, idx) => (
          <Card key={idx} className="overflow-hidden">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleModule(module.title)}
            >
              <div>
                <h2 className="text-xl font-bold">{module.title}</h2>
                <p className="text-gray-600">{module.description}</p>
              </div>
              <div className="flex items-center">
                {quizResults[module.title] >= 90 && (
                  <span className="mr-2 text-green-600 font-semibold">✅ Passed</span>
                )}
                <span className="text-blue-500">
                  {expandedModule === module.title ? "▲ Hide" : "▼ Show"}
                </span>
              </div>
            </div>
            
            {expandedModule === module.title && (
              <div className="p-4 pt-0 border-t">
                <img 
                  src={module.image} 
                  alt={module.title} 
                  className="mb-4 w-full max-w-md rounded mx-auto" 
                  onError={(e) => {
                    // Use a placeholder image if the image doesn't exist
                    e.currentTarget.src = "https://placehold.co/600x400?text=Dental+Training";
                  }}
                />
                <h3 className="font-semibold mb-2">Key Steps:</h3>
                <ul className="list-disc ml-6 mb-4">
                  {module.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
                <Quiz 
                  module={module.title} 
                  questions={module.quiz} 
                  onSubmit={handleQuizSubmit}
                  currentScore={quizResults[module.title]}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

interface QuizProps {
  module: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  onSubmit: (module: string, score: number) => void;
  currentScore?: number;
}

function Quiz({ module, questions, onSubmit, currentScore }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(currentScore !== undefined);
  const [score, setScore] = useState<number | null>(currentScore || null);

  const handleChange = (qIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const result = Math.round((correct / questions.length) * 100);
    setScore(result);
    setSubmitted(true);
    onSubmit(module, result);
  };

  // Check if the quiz has been completed with a passing score already
  const isPassed = currentScore !== undefined && currentScore >= 90;

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-2">
        Quiz
        {isPassed && (
          <span className="text-green-600 ml-2 text-sm">
            (Completed with {currentScore}%)
          </span>
        )}
      </h3>
      
      {questions.map((q, i) => (
        <div key={i} className="mb-4">
          <p className="mb-1 font-medium">{i + 1}. {q.question}</p>
          {q.options.map((opt, j) => (
            <label key={j} className="block mb-1 flex items-start">
              <input
                type="radio"
                name={`q-${module}-${i}`}
                value={opt}
                onChange={() => handleChange(i, opt)}
                disabled={submitted}
                className="mr-2 mt-1"
              /> 
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ))}
      
      {!submitted && (
        <Button onClick={handleSubmit} className="mt-2">Submit Quiz</Button>
      )}
      
      {submitted && !isPassed && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="font-semibold">
            Score: {score}% {score >= 90 ? '- Passed! ✅' : '- Not Passed ❌'}
          </p>
          {score < 90 && (
            <p className="text-sm mt-1">
              You need at least 90% to pass this module. Review the material and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}