import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Training modules
const assistantModules = [
  {
    title: "HIPAA Compliance & Patient Privacy",
    description: "Essential training on patient data protection and privacy regulations.",
    steps: [
      "Understand the core principles of HIPAA Privacy Rule.",
      "Learn how to properly handle Protected Health Information (PHI).",
      "Practice secure communication about patient information.",
      "Follow protocols for electronic health record access.",
      "Document all information access and disclosure properly."
    ],
    image: "/images/hipaa.png",
    quiz: [
      {
        question: "What information is considered PHI?",
        options: ["Patient name only", "Medical diagnoses only", "Both demographic and health information", "None of the above"],
        answer: "Both demographic and health information"
      },
      {
        question: "When can you share PHI without patient authorization?",
        options: ["For treatment purposes", "With friends who ask", "On social media", "For marketing"],
        answer: "For treatment purposes"
      },
      {
        question: "What must you do before discussing a patient's condition in a waiting room?",
        options: ["Nothing special", "Get written consent", "Obtain verbal permission and ensure privacy", "Call the patient's family"],
        answer: "Obtain verbal permission and ensure privacy"
      },
      {
        question: "How should you dispose of papers with patient information?",
        options: ["Regular trash", "Recycling bin", "Shredding", "Take home"],
        answer: "Shredding"
      },
      {
        question: "What is the minimum necessary rule?",
        options: ["Using the least amount of paper", "Only accessing the PHI needed for your job", "Telling patients minimal information", "Hiring minimum staff"],
        answer: "Only accessing the PHI needed for your job"
      },
      {
        question: "What should you do if you witness a HIPAA violation?",
        options: ["Ignore it", "Post about it online", "Report it immediately", "Tell other patients"],
        answer: "Report it immediately"
      },
      {
        question: "How often must HIPAA training be completed?",
        options: ["Once when hired", "Every 5 years", "Annually", "Only when violations occur"],
        answer: "Annually"
      },
      {
        question: "Who enforces HIPAA regulations?",
        options: ["Local police", "Department of Health and Human Services", "Dental board only", "The practice owner only"],
        answer: "Department of Health and Human Services"
      },
      {
        question: "What does the HIPAA Security Rule primarily address?",
        options: ["Electronic PHI protection", "Patient rights", "Staff hiring", "Insurance billing"],
        answer: "Electronic PHI protection"
      },
      {
        question: "What is the penalty for knowingly violating HIPAA?",
        options: ["Verbal warning", "Up to $50,000 and criminal charges", "$100 fine", "No real penalties"],
        answer: "Up to $50,000 and criminal charges"
      }
    ]
  },
  {
    title: "OSHA Compliance & Workplace Safety",
    description: "Essential safety protocols for infection control and hazard prevention in dental settings.",
    steps: [
      "Learn proper PPE usage and infection control.",
      "Identify workplace hazards and prevention strategies.",
      "Understand chemical safety and SDS requirements.",
      "Follow proper sharps handling and disposal procedures.",
      "Know emergency protocols and bloodborne pathogen standards."
    ],
    image: "/images/osha.png",
    quiz: [
      {
        question: "When should you wear utility gloves?",
        options: ["Never", "When treating patients", "When handling contaminated instruments", "Only when required"],
        answer: "When handling contaminated instruments"
      },
      {
        question: "How often should you receive bloodborne pathogen training?",
        options: ["Once when hired", "Every 5 years", "Annually", "Monthly"],
        answer: "Annually"
      },
      {
        question: "What information is found on a Safety Data Sheet (SDS)?",
        options: ["Patient records", "Hazards of chemicals", "Staff schedules", "Marketing materials"],
        answer: "Hazards of chemicals"
      },
      {
        question: "What should you do if exposed to blood or body fluids?",
        options: ["Continue working", "Wash area and report immediately", "Wait until end of day to report", "Only report if symptoms develop"],
        answer: "Wash area and report immediately"
      },
      {
        question: "How should contaminated sharps be disposed of?",
        options: ["Regular trash", "Recycling", "Puncture-resistant containers", "Flush down sink"],
        answer: "Puncture-resistant containers"
      },
      {
        question: "Which best prevents aerosol contamination?",
        options: ["Open windows", "Using high-volume evacuation", "Turning off A/C", "Using fans"],
        answer: "Using high-volume evacuation"
      },
      {
        question: "What is the proper order for removing PPE?",
        options: ["Gloves first, then mask", "Mask first, then gloves", "Order doesn't matter", "Remove all at once"],
        answer: "Gloves first, then mask"
      },
      {
        question: "How should you handle clothing contaminated with blood?",
        options: ["Wash with other laundry", "Dispose as hazardous waste", "Place in laundry bag and wash separately", "Bleach immediately"],
        answer: "Place in laundry bag and wash separately"
      },
      {
        question: "What is the best way to prevent needlestick injuries?",
        options: ["Recap needles carefully", "Never recap needles", "Bend needles first", "Use fingers to recap"],
        answer: "Never recap needles"
      },
      {
        question: "How often should eyewash stations be tested?",
        options: ["Monthly", "Weekly", "Yearly", "When broken"],
        answer: "Weekly"
      }
    ]
  },
  {
    title: "ADA Patient Rights & Accessibility",
    description: "Required training for dental professionals to ensure equal treatment, communication access, and physical accommodations for all patients.",
    steps: [
      "Treat all patients with dignity, respect, and without discrimination.",
      "Ensure your practice is physically accessible — ramps, elevators, wide doors, accessible restrooms.",
      "Use respectful language when referring to people with disabilities.",
      "Offer alternate communication methods (writing, typing, sign interpreter) if a patient is hearing/speech impaired.",
      "Be prepared to assist patients who use wheelchairs or mobility aids without making them feel singled out.",
      "Do not delay or deny care due to a patient's disability — this is illegal and unethical.",
      "Comply with the ADEA's emphasis on access to care and non-discrimination in education and treatment."
    ],
    image: "/images/ada_accessibility.png",
    quiz: [
      {
        question: "What does the ADA require regarding disabled patients?",
        options: ["Charge more", "Offer faster appointments", "Equal access and no discrimination", "Separate waiting areas"],
        answer: "Equal access and no discrimination"
      },
      {
        question: "Which of the following is a required physical accommodation?",
        options: ["TV in lobby", "Wheelchair ramps and accessible restrooms", "Longer counters", "Curtains at every door"],
        answer: "Wheelchair ramps and accessible restrooms"
      },
      {
        question: "What's the best way to speak to a patient who is hearing impaired?",
        options: ["Yell", "Ignore them", "Use writing or offer a sign interpreter", "Talk to their caregiver only"],
        answer: "Use writing or offer a sign interpreter"
      },
      {
        question: "When assisting someone in a wheelchair, what's important?",
        options: ["Lift without asking", "Use jokes", "Offer assistance respectfully and don't grab their chair", "Move them quickly"],
        answer: "Offer assistance respectfully and don't grab their chair"
      },
      {
        question: "Which law protects patients from being refused care due to disability?",
        options: ["HIPAA", "OSHA", "Americans with Disabilities Act (ADA)", "EPA"],
        answer: "Americans with Disabilities Act (ADA)"
      },
      {
        question: "What principle does ADEA promote for dental teams?",
        options: ["Maximize production", "Avoid talking to patients", "Educational equity and access to care", "Charge by condition"],
        answer: "Educational equity and access to care"
      },
      {
        question: "Can a front desk deny scheduling due to a patient's disability?",
        options: ["Yes, if busy", "Only if it's a physical issue", "No, it's illegal", "Sometimes"],
        answer: "No, it's illegal"
      },
      {
        question: "If a patient needs a longer appointment due to disability, what should staff do?",
        options: ["Charge more", "Reschedule often", "Deny care", "Accommodate and schedule accordingly"],
        answer: "Accommodate and schedule accordingly"
      },
      {
        question: "What does respectful language mean?",
        options: ["Say 'they're wheelchair-bound'", "Say 'the handicapped'", "Say 'a person who uses a wheelchair'", "Avoid talking to them"],
        answer: "Say 'a person who uses a wheelchair'"
      },
      {
        question: "When must ADA compliance be re-trained?",
        options: ["Every 5 years", "Only for new hires", "Annually or when laws are updated", "Never"],
        answer: "Annually or when laws are updated"
      }
    ]
  }
];

interface QuizProps {
  module: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  onSubmit: (module: string, score: number) => void;
}

function Quiz({ module, questions, onSubmit }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);

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
    if (onSubmit) onSubmit(module, result);
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-2">Quiz</h3>
      {questions.map((q, i) => (
        <div key={i} className="mb-4">
          <p className="mb-1 font-medium">{i + 1}. {q.question}</p>
          {q.options.map((opt, j) => (
            <label key={j} className="block">
              <input
                type="radio"
                name={`q-${module}-${i}`}
                value={opt}
                onChange={() => handleChange(i, opt)}
                disabled={submitted}
              /> {opt}
            </label>
          ))}
        </div>
      ))}
      {!submitted && (
        <Button onClick={handleSubmit}>Submit Quiz</Button>
      )}
      {submitted && score !== null && (
        <p className="mt-2 font-semibold">Score: {score}%</p>
      )}
    </div>
  );
}

export default function AssistantTab() {
  const [quizResults, setQuizResults] = useState<Record<string, number>>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [certified, setCertified] = useState({ 
    hipaa: false, 
    osha: false, 
    ada: false 
  });

  const handleQuizSubmit = (title: string, score: number) => {
    setQuizResults(prev => ({ ...prev, [title]: score }));
    
    // Update certification status
    if (title.includes("HIPAA") && score >= 90) {
      setCertified(prev => ({ ...prev, hipaa: true }));
    }
    if (title.includes("OSHA") && score >= 90) {
      setCertified(prev => ({ ...prev, osha: true }));
    }
    if (title.includes("ADA") && score >= 90) {
      setCertified(prev => ({ ...prev, ada: true }));
    }
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

  // Generate a certificate (would be replaced with proper PDF generation)
  const generateCertificate = (type: string) => {
    alert(`${type} Compliance Certificate would be generated here.`);
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
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400?text=Dental+Training";
                  }}
                />
                <h3 className="font-semibold mb-2">Key Steps:</h3>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                  {module.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
                
                <Quiz 
                  module={module.title} 
                  questions={module.quiz} 
                  onSubmit={handleQuizSubmit} 
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {(certified.hipaa || certified.osha || certified.ada) && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold mb-4">Your Certifications</h3>
          
          <div className="space-y-3">
            {certified.hipaa && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">HIPAA Compliance</span>
                  <p className="text-sm text-gray-600">Score: {quizResults["HIPAA Compliance & Patient Privacy"]}%</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => generateCertificate("HIPAA")}
                >
                  Download Certificate
                </Button>
              </div>
            )}
            
            {certified.osha && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">OSHA Compliance</span>
                  <p className="text-sm text-gray-600">Score: {quizResults["OSHA Compliance & Workplace Safety"]}%</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => generateCertificate("OSHA")}
                >
                  Download Certificate
                </Button>
              </div>
            )}
            
            {certified.ada && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">ADA Compliance</span>
                  <p className="text-sm text-gray-600">Score: {quizResults["ADA Patient Rights & Accessibility"]}%</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => generateCertificate("ADA")}
                >
                  Download Certificate
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}