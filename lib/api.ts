export async function markAttendance(imageData: string): Promise<AttendanceResponse> {
  try {
    const response = await fetch('http://localhost:5000/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark attendance');
    }

    const data = await response.json();
    return {
      success: true,
      nama: data.name || 'Unknown',
      nim: data.nim || 'Unknown',
      image: data.image || '',
      timestamp: new Date().toISOString(),
      message: 'Attendance marked successfully!',
    };
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
}