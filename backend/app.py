from flask import Flask, request, jsonify
from flask_cors import CORS
from model.face_recognizer import recognize_face  # Fungsi absensi
from datetime import datetime
import base64
import cv2
import numpy as np
import os
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# --- Fungsi untuk bersihin nama file ---
def sanitize_filename(name):
    name = re.sub(r'[^\w\s-]', '', name).strip()
    name = re.sub(r'[-\s]+', '_', name)
    return name.lower()

# --- Endpoint absensi berdasarkan wajah ---
@app.route('/attendance', methods=['POST'])
def attendance():
    data = request.get_json()

    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    try:
        image_b64 = data['image'].split(',')[-1]
        image_data = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400

        result = recognize_face(image)

        if result is None or 'nama' not in result or result['nama'] is None:
            return jsonify({'error': 'Face not recognized or name not found in result'}), 404

        response_data = {
            'name': result.get('nama', 'Unknown'),
            'nim': result.get('nim', 'Unknown'),
            'timestamp': datetime.now().isoformat(),
            'image': data['image']
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# --- Endpoint untuk pendaftaran wajah baru ---
@app.route('/register-face', methods=['POST'])
def register_face():
    data = request.get_json()

    if not data or 'nama' not in data or 'nim' not in data or 'fotoWajah' not in data:
        return jsonify({'error': 'Data tidak lengkap: nama, nim, dan fotoWajah wajib diisi'}), 400

    try:
        nama = data['nama']
        nim = data['nim']
        image_b64_data_url = data['fotoWajah']

        if ',' not in image_b64_data_url:
            return jsonify({'error': 'Format data URL gambar tidak valid'}), 400

        header, image_b64 = image_b64_data_url.split(',', 1)

        # Cek ekstensi file dari header
        file_extension = '.jpg'
        if 'image/png' in header:
            file_extension = '.png'
        elif 'image/jpeg' in header:
            file_extension = '.jpg'

        # Decode gambar base64
        image_data = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'error': 'Data gambar tidak valid setelah decode'}), 400

        # Buat nama file dan path
        sanitized_nim = sanitize_filename(nim)
        sanitized_nama = sanitize_filename(nama)
        filename = f"{sanitized_nim}_{sanitized_nama}{file_extension}"

        # Path ke folder penyimpanan relatif terhadap file ini
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        known_faces_dir = os.path.join(current_script_dir, 'data', 'known_faces')

        os.makedirs(known_faces_dir, exist_ok=True)  # Buat folder kalau belum ada

        file_path = os.path.join(known_faces_dir, filename)

        # Simpan gambar ke file
        cv2.imwrite(file_path, image)
        print(f"File berhasil disimpan: {file_path}")

        return jsonify({'message': 'Pendaftaran wajah berhasil!', 'filePath': file_path}), 201

    except Exception as e:
        print(f"Error saat pendaftaran wajah: {e}")
        return jsonify({'error': f'Terjadi kesalahan pada server: {str(e)}'}), 500

# --- Run Flask ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
