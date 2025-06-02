from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import base64
import cv2
import numpy as np
import os
import re
import face_recognition
# import pickle # Tidak diperlukan lagi jika encoding disimpan di DB

# Impor untuk koneksi database (contoh dengan psycopg2)
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
load_dotenv()
# Asumsikan kamu akan memindahkan logika inti face recognition ke sini
# atau fungsi-fungsi ini akan diimplementasikan untuk berinteraksi dengan DB
# from model.face_recognizer import recognize_face_from_db, create_face_encoding_from_image

app = Flask(__name__) # Menggunakan __name__ standar Flask
CORS(app, resources={r"/*": {"origins": "*"}}) # Izinkan semua origin untuk development

# --- Konfigurasi Database (HARUS DISESUAIKAN) ---
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_NAME = os.environ.get("DB_NAME", "face_recognation") # Sesuaikan
DB_USER = os.environ.get("DB_USER", "USER_DB_ANDA") # GANTI
DB_PASS = os.environ.get("DB_PASS", "PASSWORD_DB_ANDA") # GANTI

def get_db_connection():
    try:
        conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        return conn
    except psycopg2.Error as e:
        app.logger.error(f"Flask: Error connecting to PostgreSQL: {e}")
        return None

# --- Fungsi bantu ---
def sanitize_filename(name): # Fungsi ini mungkin masih berguna untuk hal lain, tapi tidak untuk nama file encoding
    name = re.sub(r'[^\w\s-]', '', name).strip()
    name = re.sub(r'[-\s]+', '_', name)
    return name.lower()

# Fungsi load_known_faces() dan save_known_faces() yang menggunakan pickle DIHAPUS
# karena data akan diambil/disimpan ke database.

# --- Endpoint absensi ---
@app.route('/attendance', methods=['POST'])
def attendance():
    data = request.get_json()

    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    try:
        image_b64 = data['image'].split(',')[-1]
        image_data = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        image_cv2 = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_cv2 is None:
            return jsonify({'error': 'Invalid image data'}), 400

        # Deteksi wajah pada gambar yang baru diterima
        current_face_locations = face_recognition.face_locations(image_cv2)
        if not current_face_locations:
            return jsonify({'error': 'No face detected in current image'}), 404

        current_face_encodings = face_recognition.face_encodings(image_cv2, current_face_locations)
        if not current_face_encodings:
            return jsonify({'error': 'Could not create encoding for the current image'}), 400
        
        current_face_encoding = current_face_encodings[0] # Ambil encoding pertama

        # === LOGIKA BARU: Ambil data wajah dari Database ===
        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Flask: Could not connect to database for attendance.'}), 503
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        known_face_encodings_from_db = []
        known_nips_from_db = []
        known_names_from_db = []

        try:
            # Ambil NIP, nama, dan face_embedding dari tabel Karyawan
            # Pastikan nama tabel "Karyawan" dan kolom "face_embedding" sudah benar
            cursor.execute("SELECT nip, nama, face_embedding FROM \"Karyawan\" WHERE face_embedding IS NOT NULL")
            all_karyawan_with_embeddings = cursor.fetchall()

            for row in all_karyawan_with_embeddings:
                try:
                    # Konversi string encoding dari DB kembali ke numpy array
                    str_encoding = row['face_embedding']
                    float_list = [float(x) for x in str_encoding.strip('[]').split(',')]
                    known_face_encodings_from_db.append(np.array(float_list))
                    known_nips_from_db.append(row['nip'])
                    known_names_from_db.append(row['nama'])
                except (ValueError, TypeError) as e:
                    app.logger.warning(f"Flask: Skipping NIP {row['nip']} due to parsing error in face_embedding: {e}")
                    continue
            
            if not known_face_encodings_from_db:
                 return jsonify({'error': 'No known faces with valid embeddings found in database'}), 404

            # Lakukan perbandingan
            matches = face_recognition.compare_faces(known_face_encodings_from_db, current_face_encoding, tolerance=0.5)
            distances = face_recognition.face_distance(known_face_encodings_from_db, current_face_encoding)

            if len(distances) == 0:
                return jsonify({'error': 'Face distance calculation failed or no known faces to compare against.'}), 500

            best_match_index = np.argmin(distances)
            if matches[best_match_index]:
                return jsonify({
                    'message': 'Face recognized',
                    'name': known_names_from_db[best_match_index],
                    'nip': known_nips_from_db[best_match_index]
                    # Timestamp akan dibuat oleh Next.js saat mencatat absensi
                    # 'image' (gambar asli) tidak perlu dikembalikan lagi ke Next.js dari sini
                }), 200
            else:
                return jsonify({'error': 'Face not recognized'}), 404

        except psycopg2.Error as db_err:
            app.logger.error(f"Flask: Database error during attendance check: {str(db_err)}")
            return jsonify({'error': f'Flask Database error: {str(db_err)}'}), 500
        finally:
            if conn:
                cursor.close()
                conn.close()

    except Exception as e:
        app.logger.error(f"Flask: Error in /attendance endpoint: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# --- Endpoint pendaftaran wajah (sekarang mengupdate DB) ---
@app.route('/register-face', methods=['POST'])
def register_face():
    data = request.get_json()

    # Next.js akan mengirim NIP, nama (opsional), dan fotoWajah
    if not data or 'nip' not in data or 'fotoWajah' not in data:
        return jsonify({'error': 'Data tidak lengkap dari Next.js: nip dan fotoWajah wajib diisi'}), 400

    try:
        nip_karyawan = data['nip']
        # nama_karyawan = data.get('nama', 'Unknown') # Bisa diambil untuk logging
        image_b64_data_url = data['fotoWajah']

        if ',' not in image_b64_data_url:
            return jsonify({'error': 'Format data URL gambar tidak valid'}), 400

        header, image_b64 = image_b64_data_url.split(',', 1)
        # file_extension = '.jpg' if 'image/jpeg' in header else '.png' # Tidak perlu simpan file di Flask

        image_data = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        image_cv2 = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_cv2 is None:
            return jsonify({'error': 'Data gambar tidak valid setelah decode (Flask)'}), 400

        face_locations = face_recognition.face_locations(image_cv2)
        if not face_locations:
            return jsonify({'error': 'Tidak ada wajah terdeteksi (Flask)'}), 400
        if len(face_locations) > 1:
             return jsonify({'error': 'Terdeteksi lebih dari satu wajah. Harap pastikan hanya satu wajah di foto.'}), 400

        face_encoding_array = face_recognition.face_encodings(image_cv2, face_locations)[0]
        face_encoding_list_of_python_floats = [float(val) for val in face_encoding_array]
        face_encoding_str = str(face_encoding_list_of_python_floats) 

        # === LOGIKA BARU: Simpan/Update encoding ke Database ===
        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Flask: Could not connect to database for registration.'}), 503
        
        cursor = conn.cursor()
        try:
            # Update kolom face_embedding di tabel Karyawan untuk NIP yang sesuai
            # Pastikan tabel "Karyawan" dan kolom "face_embedding" sudah ada
            cursor.execute(
                """
                UPDATE "Karyawan" 
                SET face_embedding = %s, "updatedAt" = %s 
                WHERE nip = %s
                RETURNING nama 
                """,
                (face_encoding_str, datetime.now(), nip_karyawan)
            )
            updated_info = cursor.fetchone()
            conn.commit()

            if updated_info:
                k_nama = updated_info[0]
                app.logger.info(f"Flask: Face encoding untuk NIP {nip_karyawan} ({k_nama}) berhasil disimpan/diupdate ke DB.")
                return jsonify({'message': f'Face encoding untuk {k_nama} (NIP: {nip_karyawan}) berhasil diproses dan disimpan.'}), 200 # 200 OK untuk update
            else:
                # Ini berarti NIP yang dikirim Next.js tidak ditemukan di tabel Karyawan.
                # Alur di Next.js seharusnya sudah membuat record Karyawan terlebih dahulu.
                app.logger.warning(f"Flask: Karyawan dengan NIP {nip_karyawan} tidak ditemukan di DB saat mencoba update face_embedding.")
                return jsonify({'error': f'Karyawan dengan NIP {nip_karyawan} tidak ditemukan di database untuk diupdate.'}), 404
        
        except psycopg2.Error as db_err:
            conn.rollback()
            app.logger.error(f"Flask: Database error saat update face_embedding: {str(db_err)}")
            return jsonify({'error': f'Flask Database error: {str(db_err)}'}), 500
        finally:
            if conn:
                cursor.close()
                conn.close()

    except Exception as e:
        app.logger.error(f"Flask: Error di endpoint /register-face: {str(e)}")
        return jsonify({'error': f'Flask: Terjadi kesalahan server internal: {str(e)}'}), 500
    
    
# --- Endpoint Login ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Admin hardcoded
    if email == 'admin@example.com' and password == 'admin123':
        return jsonify({"message": "Login berhasil", "role": "admin"}), 200

    # Login karyawan dari database
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Tidak bisa konek ke database"}), 503

    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT nama FROM public."Karyawan"
            WHERE email = %s AND password = %s
        """, (email, password))
        karyawan = cursor.fetchone()
        if karyawan:
            return jsonify({
                "message": "Login berhasil",
                "role": "user",
                "nama": karyawan[0]
            }), 200
        else:
            return jsonify({"message": "Email atau password salah"}), 401
    except psycopg2.Error as db_err:
        return jsonify({"error": f"Database error: {str(db_err)}"}), 500
    finally:
        cursor.close()
        conn.close()
            
# --- Jalankan server ---
if __name__ == '__main__': # Menggunakan __name__ standar Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
