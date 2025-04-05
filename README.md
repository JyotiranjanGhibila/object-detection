# Video Object Detection Dashboard
https://object-detection-wine-alpha.vercel.app/

This project implements a full video processing pipeline using FastAPI, YOLOv5, and OpenCV. The goal is to detect persons in a video, draw bounding boxes, store detection results in MongoDB, and re-encode the final video for browser playback.

## Routes : 
    get videos : https://object-detection-4-tu7z.onrender.com/videos
    upload video :https://object-detection-4-tu7z.onrender.com/upload
    process video : https://object-detection-4-tu7z.onrender.com/process/{videoId}
    detections : https://object-detection-4-tu7z.onrender.com/detections/{videoId}

![image](https://github.com/user-attachments/assets/0a4be317-5f30-4ff7-8d09-8299d4f59ddb)

⚙️ How It Works
Video Upload

A video is uploaded and saved to a folder.

Its metadata is stored in MongoDB (videos_collection).

Processing Endpoint

Endpoint: POST /process/{video_id}

Fetches video path from MongoDB using the provided video_id.

Frame-by-Frame Processing

Opens the video using OpenCV (cv2.VideoCapture).

Reads each frame and runs it through a pre-trained YOLOv5 model.

Detects persons (class == 0) and draws bounding boxes.

Annotated frames are written to an output video file.

Re-Encoding the Video

After processing, the raw OpenCV video may not be compatible with all browsers.

So, we re-encode the video using FFmpeg (libx264, yuv420p).

This ensures better compatibility across platforms.

Storing Detection Results

All detections (frame number, bounding box, confidence, class) are collected.

Results are inserted into MongoDB using detections_collection.

![image](https://github.com/user-attachments/assets/aebc7400-1f89-47ad-bc93-b3c405456d71)

## ⚙️ Tech Stack

### 🚀 Backend (FastAPI)
- FastAPI
- Python (with OpenCV / YOLO / etc.)
- Uvicorn
- Pydantic
- CORS Middleware

### 💻 Frontend (React)
- React.js (Vite / CRA)
- Axios
- TailwindCSS
- Responsive UI


---

## 🛠️ Setup Instructions

### 1️⃣ Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload

### 1️⃣ Frontend (React.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create a `.env` file and add your backend URL
REACT_APP_API_URL=http://localhost:8000

# Start React server
npm run dev   # Or: npm start (for CRA)
