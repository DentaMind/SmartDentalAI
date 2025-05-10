from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_audit_report(metrics: Dict[str, Any], anomalies: List[Dict[str, Any]], 
                              historical_data: Dict[str, Any], time_range: int = 1) -> str:
    """Generate an AI-powered audit report of system health."""
    
    # Prepare the context for GPT
    context = {
        "metrics": metrics,
        "anomalies": anomalies,
        "historical_data": historical_data,
        "time_range": time_range,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Create the prompt for GPT
    prompt = f"""
    You are an AI system health auditor for a dental AI platform. Analyze the following system metrics and generate a comprehensive report.
    
    System Context:
    - Time Range: Last {time_range} day(s)
    - Current Timestamp: {context['timestamp']}
    
    Key Metrics:
    - Accuracy: {metrics.get('accuracy', 0):.2%}
    - Precision: {metrics.get('precision', 0):.2%}
    - Recall: {metrics.get('recall', 0):.2%}
    - F1 Score: {metrics.get('f1_score', 0):.2%}
    
    Anomalies Detected: {len(anomalies)}
    Historical Trends: {json.dumps(historical_data.get('trend_analysis', {}), indent=2)}
    
    Please generate a report that includes:
    1. Executive Summary
    2. Performance Analysis
    3. Anomaly Assessment
    4. Trend Analysis
    5. Recommendations
    6. Risk Assessment
    
    Format the report in markdown with clear sections and bullet points where appropriate.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert AI system auditor specializing in machine learning systems."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audit report: {str(e)}")

@router.get("/report")
async def get_audit_report(time_range: int = 1):
    """Generate and return an AI-powered audit report."""
    try:
        # Get the latest metrics and anomalies
        metrics = await get_learning_metrics()
        anomalies = await get_anomalies()
        historical_data = await get_historical_analysis(time_range)
        
        # Generate the report
        report = await generate_audit_report(metrics, anomalies, historical_data, time_range)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "time_range": time_range,
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/history")
async def get_audit_report_history(days: int = 7):
    """Get historical audit reports."""
    try:
        # In a production system, this would fetch from a database
        # For now, we'll generate a new report for each day
        reports = []
        for i in range(days):
            metrics = await get_learning_metrics()
            anomalies = await get_anomalies()
            historical_data = await get_historical_analysis(1)  # 1 day range
            
            report = await generate_audit_report(metrics, anomalies, historical_data, 1)
            
            reports.append({
                "timestamp": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                "report": report
            })
        
        return {
            "count": len(reports),
            "reports": reports
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 