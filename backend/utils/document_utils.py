"""
Document utilities for PDF generation and storage.
"""
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from PyPDF2 import PdfMerger
from typing import Dict, List, Any, Tuple
from datetime import datetime, timezone
from bson import Binary
from db.connectDB import db
from utils.logger import get_logger

logger = get_logger(__name__)


async def merge_pdfs(form_data: Dict[str, Any], document_list: List[bytes]) -> bytes:
    """
    Merge form data and uploaded PDFs into a single document.
    
    Args:
        form_data: Dictionary containing applicant information
        document_list: List of document bytes to merge
    
    Returns:
        Merged PDF bytes
    """
    try:
        logger.info(f"[MERGE_PDF] Starting PDF merge for {len(document_list)} documents")
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=30,
            alignment=1
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Title
        story.append(Paragraph("SSDI Application Summary", title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Application ID and Date
        story.append(Paragraph(f"<b>Submission Date:</b> {datetime.now(timezone.utc).strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Personal Information Section
        story.append(Paragraph("Personal Information", heading_style))
        
        personal_data = [
            ["Full Name:", f"{form_data.get('firstName', '')} {form_data.get('lastName', '')}"],
            ["Date of Birth:", form_data.get('dateOfBirth', 'N/A')],
            ["Social Security Number:", form_data.get('socialSecurityNumber', 'N/A')],
        ]

        personal_table = Table(personal_data, colWidths=[2*inch, 4*inch])
        personal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(personal_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Address Section
        story.append(Paragraph("Address", heading_style))
        
        address_data = [
            ["Street Address:", form_data.get('streetAddress', 'N/A')],
            ["City:", form_data.get('city', 'N/A')],
            ["State:", form_data.get('state', 'N/A')],
            ["ZIP Code:", form_data.get('zipCode', 'N/A')],
        ]
        
        address_table = Table(address_data, colWidths=[2*inch, 4*inch])
        address_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(address_table)
        story.append(Spacer(1, 0.5*inch))
        
        # Document Information
        story.append(Paragraph("Attached Documents", heading_style))
        story.append(Paragraph(f"• Total Documents: {len(document_list)}", styles['Normal']))

        # Build cover page PDF
        doc.build(story)
        buffer.seek(0)
        cover_page_bytes = buffer.getvalue()
        
        # Merge all PDFs
        merger = PdfMerger()
        
        # Add cover page
        merger.append(BytesIO(cover_page_bytes))
        
        # Add all documents from the list
        for doc_bytes in document_list:
            merger.append(BytesIO(doc_bytes))
        
        # Write to output buffer
        output_buffer = BytesIO()
        merger.write(output_buffer)
        merger.close()
        
        output_buffer.seek(0)
        return output_buffer.getvalue()
    except Exception as e:
        logger.error(f"[MERGE_PDF] PDF generation failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise e


async def store_documents_in_db(combined_document: bytes, combined_document_name: str) -> Dict[str, str]:
    """
    Store PDF documents in MongoDB and return document references.
    
    Args:
        combined_document: Combined PDF document bytes
        combined_document_name: Filename for the combined document
    
    Returns:
        Dict containing document_id, filename, and document_type
    """
    try:
        logger.debug(f"[STORE_DOCS] Storing document: {combined_document_name}")
        
        medical_doc = {
            "filename": combined_document_name,
            "content_type": "application/pdf",
            "data": Binary(combined_document),
            "uploaded_at": datetime.now(timezone.utc),
            "document_type": "medical_records"
        }
        combined_result = await db.documents.insert_one(medical_doc)
        document = {
            "document_id": str(combined_result.inserted_id),
            "filename": combined_document_name,
            "document_type": "combined_document"
        }
        logger.debug(f"[STORE_DOCS] Document stored with ID: {document['document_id']}")
        return document
    
    except Exception as e:
        logger.error(f"[STORE_DOCS] Failed to store documents in MongoDB: {type(e).__name__}: {str(e)}", exc_info=True)
        raise e
