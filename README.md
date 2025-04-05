# Video Object Detection Dashboard
https://object-detection-wine-alpha.vercel.app/
An end-to-end object detection system using **FastAPI** backend and **ReactJS** frontend. This project allows users to upload a video, process it with object detection models, and view both the original and processed videos side-by-side along with a paginated table of detected objects.

## Routes : 
    get videos : https://object-detection-4-tu7z.onrender.com/videos
    upload video :https://object-detection-4-tu7z.onrender.com/upload
    process video : https://object-detection-4-tu7z.onrender.com/process/{videoId}
    detections : https://object-detection-4-tu7z.onrender.com/detections/{videoId}

![image](https://github.com/user-attachments/assets/0a4be317-5f30-4ff7-8d09-8299d4f59ddb)

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
