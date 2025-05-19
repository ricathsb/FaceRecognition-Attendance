from flask import Flask, request, jsonify
from flask_cors import CORS
from model.face_recognizer import recognize_face
from datetime import datetime
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/attendance', methods=['POST'])
def attendance():
    data = request.get_json()

    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    # Decode base64 image (remove data URI prefix if ada)
    image_b64 = data['image'].split(',')[-1]
    image_data = base64.b64decode(image_b64)
    np_arr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Kenali wajah
    result = recognize_face(image)

    if result is None:
        return jsonify({'error': 'Face not recognized'}), 404

    # Tambahkan timestamp ISO 8601
    result['timestamp'] = datetime.now().isoformat()
    # Ganti key 'nama' ke 'name', jika tidak ada isi 'Unknown'
    result['name'] = result.pop('nama', 'Unknown')
    # Sertakan kembali image original (beserta prefix data:image/jpeg;base64,...)
    result['image'] = data['image']

    return jsonify(result), 200

if __name__ == '__main__':
    app.run(debug=True)
