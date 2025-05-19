import face_recognition
import os

KNOWN_FACE_DIR = 'data/known_faces'

# Load all known faces at startup
known_encodings = []
known_names = []

for filename in os.listdir(KNOWN_FACE_DIR):
    if filename.endswith(('.jpg', '.png', '.jpeg')):
        path = os.path.join(KNOWN_FACE_DIR, filename)
        image = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(image)
        if encodings:
            known_encodings.append(encodings[0])
            name = os.path.splitext(filename)[0]
            nim, nama = name.split('_', 1)
            known_names.append({'nim': nim, 'nama': nama})

def recognize_face(image):
    unknown_encodings = face_recognition.face_encodings(image)

    if not unknown_encodings:
        return None

    unknown_encoding = unknown_encodings[0]
    results = face_recognition.compare_faces(known_encodings, unknown_encoding)
    if True in results:
        match_index = results.index(True)
        return known_names[match_index]
    return None
