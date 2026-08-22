from services.ocr_service import extract_text_from_image


file_path = r"C:\Users\balas\Downloads\ocr_test.png"

text = extract_text_from_image(file_path)

print("===== OCR RESULT =====")
print(text)