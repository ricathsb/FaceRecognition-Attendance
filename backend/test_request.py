import requests
import base64

# Path file gambarnya
file_path = "data/known_faces/221401109_Muhammad Fadhlan Tanjung.jpg"

# Baca file gambar dan encode ke base64
with open(file_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

# Siapkan data JSON
data = {
    "image": f"data:image/jpeg;base64,{encoded_string}"
}

# Kirim POST request ke server
url = "http://localhost:5000/attendance"
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=data, headers=headers)

print("Status:", response.status_code)
print("Response:", response.json())
