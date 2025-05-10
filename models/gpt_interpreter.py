import os
from typing import Dict, Any, List
import logging
from dotenv import load_dotenv
import openai
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class GPTInterpreter:
    def __init__(self, use_mock: bool = True):
        """
        Initialize GPT interpreter with optional mock mode
        
        Args:
            use_mock: If True, use mock responses instead of real GPT API
        """
        self.use_mock = use_mock
        
        if not self.use_mock:
            self.api_key = os.getenv("OPENAI_API_KEY")
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            openai.api_key = self.api_key
            logger.info("Initialized GPT interpreter in live mode")
        else:
            logger.info("Initialized GPT interpreter in mock mode")

    def interpret_diagnosis(self, diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate clinical interpretation of diagnosis"""
        try:
            if self.use_mock:
                return self._get_mock_interpretation(diagnosis)
            
            return self._get_gpt_interpretation(diagnosis)
            
        except Exception as e:
            logger.error(f"Interpretation failed: {str(e)}")
            return {
                "error": f"Failed to generate interpretation: {str(e)}",
                "raw_diagnosis": diagnosis
            }

    def _get_mock_interpretation(self, diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock interpretation for testing"""
        findings = diagnosis.get("findings", [])
        interpretations = []
        
        for finding in findings:
            if finding["type"] == "caries":
                interpretations.append({
                    "condition": "Caries",
                    "location": finding["location"],
                    "interpretation": f"Caries detected at {finding['location']} with {finding['severity']} severity. " 
                                    f"Confidence: {finding['confidence']:.2f}",
                    "recommendations": finding.get("recommendations", []),
                    "urgency": "moderate" if finding["severity"] == "moderate" else "low"
                })
            elif finding["type"] == "bone_loss":
                interpretations.append({
                    "condition": "Bone Loss",
                    "location": finding["location"],
                    "interpretation": f"Bone loss observed at {finding['location']}. "
                                    f"Pattern: {finding['measurements']['pattern']}. "
                                    f"Level: {finding['measurements']['bone_level']}",
                    "recommendations": [
                        "Consider full periodontal probing",
                        "Evaluate for periodontal treatment"
                    ],
                    "urgency": "moderate"
                })

        # Generate summary
        summary = "Clinical Summary: "
        if interpretations:
            summary += "Multiple findings detected. " + " ".join(
                i["interpretation"] for i in interpretations
            )
        else:
            summary = "No significant findings detected in this image."

        return {
            "interpretations": interpretations,
            "summary": summary,
            "recommendations": {
                "treatment": self._aggregate_recommendations(interpretations),
                "followup": ["Schedule follow-up in 6 months", "Consider full mouth series"],
                "urgent": any(i["urgency"] == "high" for i in interpretations)
            }
        }

    def _get_gpt_interpretation(self, diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate interpretation using GPT API"""
        try:
            # Prepare prompt
            prompt = self._create_gpt_prompt(diagnosis)
            
            # Call GPT API
            response = openai.ChatCompletion.create(
                model="gpt-4",  # or gpt-3.5-turbo
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent medical advice
                max_tokens=500
            )
            
            # Parse response
            interpretation = json.loads(response.choices[0].message.content)
            return interpretation
            
        except Exception as e:
            logger.error(f"GPT API error: {str(e)}")
            raise

    def _create_gpt_prompt(self, diagnosis: Dict[str, Any]) -> str:
        """Create prompt for GPT API"""
        return f"""
        Please analyze the following dental X-ray findings and provide a clinical interpretation:
        
        {json.dumps(diagnosis, indent=2)}
        
        Please provide your response in the following JSON format:
        {{
            "interpretations": [
                {{
                    "condition": "condition name",
                    "location": "tooth/area location",
                    "interpretation": "detailed clinical interpretation",
                    "recommendations": ["list", "of", "recommendations"],
                    "urgency": "low|moderate|high"
                }}
            ],
            "summary": "overall clinical summary",
            "recommendations": {{
                "treatment": ["prioritized", "treatment", "recommendations"],
                "followup": ["followup", "recommendations"],
                "urgent": boolean
            }}
        }}
        """

    def _get_system_prompt(self) -> str:
        """Get system prompt for GPT"""
        return """
        You are an experienced dental radiologist providing clinical interpretations of dental X-ray findings.
        Your role is to:
        1. Analyze the diagnostic findings
        2. Provide clear clinical interpretations
        3. Suggest evidence-based treatment recommendations
        4. Highlight any urgent concerns
        5. Maintain a professional, clinical tone
        
        Please provide your response in the specified JSON format.
        """

    def _aggregate_recommendations(self, interpretations: List[Dict[str, Any]]) -> List[str]:
        """Aggregate recommendations from multiple findings"""
        all_recs = []
        for i in interpretations:
            all_recs.extend(i.get("recommendations", []))
        return list(set(all_recs))  # Remove duplicates 