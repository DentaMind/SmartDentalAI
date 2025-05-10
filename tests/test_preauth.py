"""
Tests for pre-authorization packet generator.
"""

import pytest
from pathlib import Path
from datetime import datetime

from insurance.preauth import PreAuthRequest, PreAuthPacketGenerator
from insurance.cdt_codes import ProcedureCategory, get_codes_by_category
from utils.email_sender import EmailSender

def test_preauth_request_validation():
    """Test pre-auth request validation"""
    # Valid request
    request = PreAuthRequest(
        patient_id="P12345",
        patient_name="John Doe",
        provider_id="DR789",
        provider_name="Dr. Smith",
        cdt_codes=["D3310"],  # Root canal requiring x-ray
        diagnosis="Irreversible pulpitis #8",
        clinical_notes="Patient presents with severe pain and sensitivity to cold",
        xray_paths=[Path("test.jpg")]
    )
    
    validation = request.validate()
    assert all(validation.values())
    
    # Invalid request - missing x-rays
    request = PreAuthRequest(
        patient_id="P12345",
        patient_name="John Doe",
        provider_id="DR789",
        provider_name="Dr. Smith",
        cdt_codes=["D3310"],  # Root canal requiring x-ray
        diagnosis="Irreversible pulpitis #8",
        clinical_notes="Patient presents with severe pain and sensitivity to cold"
    )
    
    validation = request.validate()
    assert not validation["has_xrays"]
    
def test_packet_generation(tmp_path):
    """Test generating pre-auth packet"""
    # Create test request
    request = PreAuthRequest(
        patient_id="P12345",
        patient_name="John Doe",
        provider_id="DR789",
        provider_name="Dr. Smith",
        cdt_codes=["D3310", "D2950"],  # Root canal + build-up
        diagnosis="Irreversible pulpitis #8",
        clinical_notes="Patient presents with severe pain and sensitivity to cold",
        xray_paths=[Path("test.jpg")],
        narrative="Patient requires endodontic therapy due to extensive decay"
    )
    
    # Generate packet
    generator = PreAuthPacketGenerator()
    packet = generator.generate_packet(request, tmp_path)
    
    # Verify files were created
    assert Path(packet["document_path"]).exists()
    assert Path(packet["metadata_path"]).exists()
    
    # Check content
    content = packet["content"]
    assert "PRE-AUTHORIZATION REQUEST" in content
    assert "John Doe" in content
    assert "Dr. Smith" in content
    assert "D3310" in content
    assert "D2950" in content
    
def test_email_sending(mocker):
    """Test sending pre-auth packet via email"""
    # Mock EmailSender
    mock_sender = mocker.Mock(spec=EmailSender)
    mock_sender.send_report.return_value = True
    
    # Create test request
    request = PreAuthRequest(
        patient_id="P12345",
        patient_name="John Doe",
        provider_id="DR789",
        provider_name="Dr. Smith",
        cdt_codes=["D3310"],
        diagnosis="Irreversible pulpitis #8",
        clinical_notes="Patient presents with severe pain and sensitivity to cold",
        xray_paths=[Path("test.jpg")]
    )
    
    # Mock packet data
    packet_data = {
        "document_path": "test.txt",
        "metadata_path": "test.json",
        "content": "Test content",
        "metadata": {}
    }
    
    # Send packet
    generator = PreAuthPacketGenerator(email_sender=mock_sender)
    success = generator.send_packet(
        request=request,
        to_email="insurance@test.com",
        packet_data=packet_data,
        cc=["office@test.com"]
    )
    
    assert success
    mock_sender.send_report.assert_called_once()
    
def test_complex_treatment_plan(tmp_path):
    """Test generating packet for complex treatment plan"""
    # Get all periodontal procedures
    perio_codes = get_codes_by_category(ProcedureCategory.PERIODONTICS)
    perio_code_numbers = [code.code for code in perio_codes]
    
    # Create request with multiple procedures
    request = PreAuthRequest(
        patient_id="P12345",
        patient_name="John Doe",
        provider_id="DR789",
        provider_name="Dr. Smith",
        cdt_codes=perio_code_numbers,
        diagnosis="Generalized moderate to severe periodontitis",
        clinical_notes="""
        Patient presents with:
        - 5-7mm pocketing in all quadrants
        - Bleeding on probing: 40%
        - Bone loss evident on radiographs
        """,
        xray_paths=[Path(f"xray_{i}.jpg") for i in range(1, 5)],
        narrative="""
        Patient requires comprehensive periodontal therapy including scaling
        and root planing in all quadrants due to extensive periodontal disease.
        """
    )
    
    # Generate packet
    generator = PreAuthPacketGenerator()
    packet = generator.generate_packet(request, tmp_path)
    
    # Verify content includes all procedures
    content = packet["content"]
    for code in perio_code_numbers:
        assert code in content 