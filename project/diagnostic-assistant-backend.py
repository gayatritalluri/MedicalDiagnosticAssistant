from typing import Dict, List, Optional
import base64
from datetime import datetime
from pydantic import BaseModel
import io
import logging
from PIL import Image
from groq import Groq

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Environment variables would be set in production
GROQ_API_KEY = "your-groq-api-key"
client = Groq(api_key=GROQ_API_KEY)

# Data models
class SymptomAnalysis(BaseModel):
    conditions: List[str]
    confidence: float
    urgency: str

class ImageAnalysis(BaseModel):
    finding: str
    confidence: float
    recommendations: List[str]

class DiagnosticResult(BaseModel):
    symptom_analysis: Optional[SymptomAnalysis]
    image_analysis: Optional[ImageAnalysis]
    timestamp: str

# Symptom patterns - Expand as needed
SYMPTOM_PATTERNS = {
    "chest pain": {
        "high_risk": ["heart attack", "pulmonary embolism"],
        "medium_risk": ["angina", "costochondritis"],
        "low_risk": ["muscle strain", "acid reflux"]
    },
    "headache": {
        "high_risk": ["meningitis", "brain tumor"],
        "medium_risk": ["migraine", "tension headache"],
        "low_risk": ["dehydration", "eye strain"]
    }
}

class DiagnosticAssistant:
    def __init__(self):
        self.model = "mixtral-8x7b-32768"  # Using Groq's Mixtral model
    
    def _decode_image(self, image_data: str) -> Image:
        """Decodes a base64 image string."""
        try:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            return Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logging.error(f"Error decoding image: {e}")
            return None

    def _process_image(self, image_data: str, image_type: str) -> Optional[ImageAnalysis]:
        """Process medical images using LLM vision capabilities."""
        image = self._decode_image(image_data)
        if not image:
            return None
        
        # Mock image analysis response
        mock_findings = {
            "chest": ImageAnalysis(
                finding="Potential opacity in right upper lobe, clear lung fields otherwise",
                confidence=0.85,
                recommendations=["Follow-up chest X-ray in 6-8 weeks", "Clinical correlation recommended"]
            ),
            "brain": ImageAnalysis(
                finding="No acute intracranial abnormalities",
                confidence=0.92,
                recommendations=["Monitor symptoms", "Follow-up MRI if necessary"]
            )
        }
        return mock_findings.get(image_type.lower())

    def _analyze_symptoms(self, symptoms: str) -> SymptomAnalysis:
        """Analyzes symptoms using a simple rule-based approach and LLM."""
        prompt = f"""
        Analyze the following symptoms and provide potential diagnoses. 
        Consider urgency level and confidence based on symptom patterns:
        
        Symptoms: {symptoms}
        
        Provide the response in structured JSON format:
        {{"conditions": ["Condition1", "Condition2"], "confidence": 0.85, "urgency": "High"}}
        """
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a medical diagnostic AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            response_text = response.choices[0].message.content
            logging.info(f"LLM Response: {response_text}")
            
            # Basic rule-based matching as fallback
            symptoms_lower = symptoms.lower()
            conditions, urgency, confidence = [], "Low", 0.5
            
            for symptom, risk_levels in SYMPTOM_PATTERNS.items():
                if symptom in symptoms_lower:
                    if any(high_risk in symptoms_lower for high_risk in risk_levels["high_risk"]):
                        urgency, conditions, confidence = "High", risk_levels["high_risk"], 0.9
                    elif any(med_risk in symptoms_lower for med_risk in risk_levels["medium_risk"]):
                        urgency, conditions, confidence = "Medium", risk_levels["medium_risk"], 0.7
                    else:
                        conditions = risk_levels["low_risk"]
                        confidence = 0.5

            return SymptomAnalysis(
                conditions=conditions or ["Non-specific symptoms detected"],
                confidence=confidence,
                urgency=urgency
            )
        
        except Exception as e:
            logging.error(f"Error in symptom analysis: {e}")
            return SymptomAnalysis(
                conditions=["Error in analysis"],
                confidence=0.0,
                urgency="High"
            )
    
    async def generate_diagnosis(self, symptoms: Optional[str] = None, image_data: Optional[str] = None, image_type: Optional[str] = None) -> DiagnosticResult:
        """Generates a diagnostic report based on symptoms and/or image analysis."""
        symptom_analysis = self._analyze_symptoms(symptoms) if symptoms else None
        image_analysis = self._process_image(image_data, image_type) if image_data and image_type else None
        
        return DiagnosticResult(
            symptom_analysis=symptom_analysis,
            image_analysis=image_analysis,
            timestamp=datetime.utcnow().isoformat()
        )

# Usage example
async def main():
    assistant = DiagnosticAssistant()
    
    result = await assistant.generate_diagnosis(
        symptoms="Severe chest pain with shortness of breath",
        image_data="base64_encoded_image_data",  # Replace with actual image data
        image_type="chest"
    )
    
    logging.info("Diagnostic Results:")
    logging.info(f"Timestamp: {result.timestamp}")
    
    if result.symptom_analysis:
        logging.info(f"\nSymptom Analysis: {result.symptom_analysis}")
    if result.image_analysis:
        logging.info(f"\nImage Analysis: {result.image_analysis}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
