"""
Pre-authorization packet generator for insurance submissions.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import json

from .cdt_codes import CDTCode, get_cdt_code, get_preauth_requirements
from utils.email_sender import EmailSender

@dataclass
class PreAuthRequest:
    patient_id: str
    patient_name: str
    provider_id: str
    provider_name: str
    cdt_codes: List[str]
    diagnosis: str
    clinical_notes: str
    xray_paths: Optional[List[Path]] = None
    narrative: Optional[str] = None
    
    def validate(self) -> Dict[str, bool]:
        """Validate that all required elements are present"""
        requirements = {
            code: get_preauth_requirements(code)
            for code in self.cdt_codes
        }
        
        # Check requirements for each code
        validation = {
            "has_xrays": bool(self.xray_paths) if any(
                req.get("requires_xray", False) 
                for req in requirements.values()
            ) else True,
            "has_narrative": bool(self.narrative) if any(
                req.get("requires_narrative", False)
                for req in requirements.values()
            ) else True
        }
        
        # Basic field validation
        validation.update({
            "has_patient_info": bool(self.patient_id and self.patient_name),
            "has_provider_info": bool(self.provider_id and self.provider_name),
            "has_diagnosis": bool(self.diagnosis),
            "has_clinical_notes": bool(self.clinical_notes)
        })
        
        return validation

class PreAuthPacketGenerator:
    def __init__(self, email_sender: Optional[EmailSender] = None):
        """Initialize the pre-auth packet generator"""
        self.email_sender = email_sender
        
    def _generate_clinical_summary(self, request: PreAuthRequest) -> str:
        """Generate clinical summary section"""
        return f"""
CLINICAL SUMMARY
---------------
Diagnosis: {request.diagnosis}

Clinical Findings:
{request.clinical_notes}

{f"Clinical Narrative:\n{request.narrative}" if request.narrative else ""}
"""

    def _generate_procedure_summary(self, request: PreAuthRequest) -> str:
        """Generate procedure and cost summary section"""
        summary = ["PROPOSED TREATMENT PLAN", "-" * 20]
        
        total_fee = 0.0
        for code in request.cdt_codes:
            cdt = get_cdt_code(code)
            if not cdt:
                continue
                
            fee = cdt.base_fee
            total_fee += fee
            
            summary.append(
                f"Code: {code} - {cdt.description}"
                f"\nFee: ${fee:.2f}"
                f"\nRequires Pre-Auth: {'Yes' if cdt.requires_preauth else 'No'}"
                f"\nRequires X-Ray: {'Yes' if cdt.requires_xray else 'No'}"
                f"\n"
            )
            
        # Add total
        summary.extend([
            "-" * 20,
            f"Total Treatment Cost: ${total_fee:.2f}",
            f"Estimated Insurance Portion: ${total_fee * 0.8:.2f}",
            f"Estimated Patient Portion: ${total_fee * 0.2:.2f}"
        ])
        
        return "\n".join(summary)

    def generate_packet(
        self,
        request: PreAuthRequest,
        output_dir: Path
    ) -> Dict[str, Any]:
        """
        Generate pre-authorization packet
        
        Args:
            request: Pre-auth request details
            output_dir: Directory to save generated files
            
        Returns:
            Dictionary with generated file paths and metadata
        """
        # Validate request
        validation = request.validate()
        if not all(validation.values()):
            missing = [k for k, v in validation.items() if not v]
            raise ValueError(
                f"Invalid pre-auth request. Missing: {', '.join(missing)}"
            )
            
        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate text content
        content = [
            f"PRE-AUTHORIZATION REQUEST - {datetime.now().strftime('%Y-%m-%d')}",
            "=" * 50,
            f"\nPATIENT INFORMATION",
            f"Name: {request.patient_name}",
            f"ID: {request.patient_id}",
            f"\nPROVIDER INFORMATION",
            f"Name: {request.provider_name}",
            f"ID: {request.provider_id}",
            f"\n{self._generate_clinical_summary(request)}",
            f"\n{self._generate_procedure_summary(request)}"
        ]
        
        # Save main document
        doc_path = output_dir / f"preauth_{request.patient_id}_{datetime.now().strftime('%Y%m%d')}.txt"
        doc_path.write_text("\n".join(content))
        
        # Save metadata
        meta = {
            "patient_id": request.patient_id,
            "provider_id": request.provider_id,
            "cdt_codes": request.cdt_codes,
            "generated_at": datetime.now().isoformat(),
            "document_path": str(doc_path),
            "xray_paths": [str(p) for p in (request.xray_paths or [])]
        }
        
        meta_path = output_dir / f"preauth_{request.patient_id}_{datetime.now().strftime('%Y%m%d')}_meta.json"
        meta_path.write_text(json.dumps(meta, indent=2))
        
        return {
            "document_path": doc_path,
            "metadata_path": meta_path,
            "content": "\n".join(content),
            "metadata": meta
        }
        
    def send_packet(
        self,
        request: PreAuthRequest,
        to_email: str,
        packet_data: Dict[str, Any],
        cc: Optional[List[str]] = None
    ) -> bool:
        """
        Send pre-authorization packet via email
        
        Args:
            request: Pre-auth request details
            to_email: Recipient email
            packet_data: Generated packet data from generate_packet()
            cc: Optional CC recipients
            
        Returns:
            True if email sent successfully
        """
        if not self.email_sender:
            raise ValueError("Email sender not configured")
            
        # Prepare email data
        data = {
            "patient_name": request.patient_name,
            "patient_id": request.patient_id,
            "provider_name": request.provider_name,
            "provider_id": request.provider_id,
            "cdt_codes": [
                {
                    "code": code,
                    "description": get_cdt_code(code).description if get_cdt_code(code) else None
                }
                for code in request.cdt_codes
            ],
            "requires_xray": any(
                get_preauth_requirements(code).get("requires_xray", False)
                for code in request.cdt_codes
            )
        }
        
        # Send email with attachments
        return self.email_sender.send_report(
            to_email=to_email,
            report_id=f"preauth_{request.patient_id}",
            report_data=data,
            pdf_path=Path(packet_data["document_path"]),
            cc=cc
        ) 