ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}

MAX_FILE_SIZE = 16 * 1024 * 1024


def is_allowed_file(filename):
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def get_file_extension(filename):
    if "." not in filename:
        return None

    return filename.rsplit(".", 1)[1].lower()