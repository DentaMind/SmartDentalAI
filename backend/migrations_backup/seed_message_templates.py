"""seed message templates

Revision ID: 5f4c3b2a19e8
Revises: 0c9b8a7d6e5f
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5f4c3b2a19e8'
down_revision = '0c9b8a7d6e5f'
branch_labels = None
depends_on = None

def upgrade():
    # Appointment Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('appt_confirm', 'Appointment Confirmation', 'Appointment Confirmation - {date} at {time}',
        'Dear {patient_name},\n\nThis is a confirmation of your appointment with {provider_name} on {date} at {time}.\n\nLocation: {location}\n\nPlease arrive 15 minutes early to complete any necessary paperwork.\n\nIf you need to reschedule or cancel, please contact us at least 24 hours in advance.\n\nBest regards,\n{clinic_name}',
        'appointment', 'book_appointment', '{"patient_name": "string", "provider_name": "string", "date": "date", "time": "time", "location": "string", "clinic_name": "string"}', true),
        
        ('appt_reminder', 'Appointment Reminder', 'Reminder: Your Appointment Tomorrow',
        'Dear {patient_name},\n\nThis is a friendly reminder of your appointment with {provider_name} tomorrow at {time}.\n\nLocation: {location}\n\nPlease bring your insurance card and any necessary documents.\n\nTo confirm or reschedule, please call us at {phone_number}.\n\nBest regards,\n{clinic_name}',
        'appointment', 'book_appointment', '{"patient_name": "string", "provider_name": "string", "time": "time", "location": "string", "phone_number": "string", "clinic_name": "string"}', true),
        
        ('appt_cancel', 'Appointment Cancellation', 'Appointment Cancellation',
        'Dear {patient_name},\n\nWe have received your request to cancel your appointment scheduled for {date} at {time}.\n\nIf you would like to reschedule, please contact us at {phone_number} or visit our online scheduling system.\n\nBest regards,\n{clinic_name}',
        'appointment', 'cancel_appointment', '{"patient_name": "string", "date": "date", "time": "time", "phone_number": "string", "clinic_name": "string"}', true)
    """)

    # Payment Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('payment_due', 'Payment Due Notice', 'Payment Due: {amount}',
        'Dear {patient_name},\n\nThis is a reminder that you have an outstanding balance of {amount}.\n\nPayment is due by {due_date}.\n\nYou can make a payment online at {payment_link} or by calling us at {phone_number}.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\n{clinic_name}',
        'payment', 'payment_request', '{"patient_name": "string", "amount": "decimal", "due_date": "date", "payment_link": "string", "phone_number": "string", "clinic_name": "string"}', true),
        
        ('payment_received', 'Payment Confirmation', 'Payment Received - Thank You',
        'Dear {patient_name},\n\nWe have received your payment of {amount} on {payment_date}.\n\nThank you for your payment. A receipt has been sent to your email.\n\nIf you have any questions, please contact our billing department at {phone_number}.\n\nBest regards,\n{clinic_name}',
        'payment', 'payment_question', '{"patient_name": "string", "amount": "decimal", "payment_date": "date", "phone_number": "string", "clinic_name": "string"}', true)
    """)

    # Insurance Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('insurance_verification', 'Insurance Verification Required', 'Action Required: Insurance Verification',
        'Dear {patient_name},\n\nWe need to verify your insurance information before your upcoming appointment.\n\nPlease provide the following information:\n- Insurance Provider: {insurance_provider}\n- Policy Number: {policy_number}\n- Group Number: {group_number}\n\nYou can update this information online at {portal_link} or by calling us at {phone_number}.\n\nBest regards,\n{clinic_name}',
        'insurance', 'verify_coverage', '{"patient_name": "string", "insurance_provider": "string", "policy_number": "string", "group_number": "string", "portal_link": "string", "phone_number": "string", "clinic_name": "string"}', true),
        
        ('insurance_question', 'Insurance Question', 'Insurance Coverage Question',
        'Dear {patient_name},\n\nWe have a question regarding your insurance coverage for {service}.\n\nPlease contact our insurance department at {phone_number} to discuss this matter.\n\nBest regards,\n{clinic_name}',
        'insurance', 'insurance_question', '{"patient_name": "string", "service": "string", "phone_number": "string", "clinic_name": "string"}', true)
    """)

    # Lab Results Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('lab_results_ready', 'Lab Results Available', 'Your Lab Results are Available',
        'Dear {patient_name},\n\nYour lab results from {test_date} are now available.\n\nYou can view your results by logging into your patient portal at {portal_link}.\n\nIf you have any questions about your results, please contact us at {phone_number}.\n\nBest regards,\n{clinic_name}',
        'lab_results', 'lab_results', '{"patient_name": "string", "test_date": "date", "portal_link": "string", "phone_number": "string", "clinic_name": "string"}', true)
    """)

    # General Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('welcome', 'Welcome Message', 'Welcome to {clinic_name}',
        'Dear {patient_name},\n\nWelcome to {clinic_name}! We are pleased to have you as a patient.\n\nYour patient portal is now set up. You can access it at {portal_link}.\n\nIf you have any questions, please don''t hesitate to contact us at {phone_number}.\n\nBest regards,\n{clinic_name}',
        'general', 'general', '{"patient_name": "string", "clinic_name": "string", "portal_link": "string", "phone_number": "string"}', true),
        
        ('feedback', 'Feedback Request', 'How was your visit?',
        'Dear {patient_name},\n\nThank you for visiting {clinic_name} on {visit_date}.\n\nWe would appreciate your feedback about your experience. Please take a moment to complete our survey at {survey_link}.\n\nYour feedback helps us improve our services.\n\nBest regards,\n{clinic_name}',
        'general', 'general', '{"patient_name": "string", "clinic_name": "string", "visit_date": "date", "survey_link": "string"}', true)
    """)

    # Urgent Templates
    op.execute("""
        INSERT INTO message_templates (id, name, subject, body, category, intent, variables, is_active)
        VALUES 
        ('urgent_followup', 'Urgent Follow-up Required', 'URGENT: Follow-up Required',
        'Dear {patient_name},\n\nThis is an urgent message regarding your recent visit on {visit_date}.\n\nPlease contact us immediately at {phone_number} to discuss your {condition}.\n\nThis is a time-sensitive matter.\n\nBest regards,\n{clinic_name}',
        'urgent', 'urgent', '{"patient_name": "string", "visit_date": "date", "phone_number": "string", "condition": "string", "clinic_name": "string"}', true)
    """)

def downgrade():
    op.execute("DELETE FROM message_templates") 