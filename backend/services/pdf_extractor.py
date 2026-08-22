import fitz


def extract_text_from_pdf(file_path):
    document = fitz.open(file_path)

    pages = []

    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text")

        pages.append({
            "page": page_number,
            "text": text.strip()
        })

    document.close()

    return pages