from services.pdf_extractor import extract_text_from_pdf


file_path = r"C:\Users\balas\Downloads\COGNIZANT INTERVIEW QUESTIONS.pdf"

pages = extract_text_from_pdf(file_path)

print(f"Total pages: {len(pages)}")

for page in pages:
    print(f"\n--- PAGE {page['page']} ---")
    print(page["text"][:500])