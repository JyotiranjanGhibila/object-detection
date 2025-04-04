from fastapi import APIRouter
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from config.db import videos_collection, detections_collection
import shutil
import os
import uuid
import cv2
import torch
import numpy as np
from bson import ObjectId
import asyncio

router = APIRouter()

UPLOAD_DIR = "static/uploads"
RESULT_DIR = "static/results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# Load YOLOv8 model
yolo_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1]
    if file_extension not in ["mp4", "avi", "mov"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the uploaded file asynchronously (not required here, but good to note)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    video_data = {"filename": unique_filename, "filepath": file_path}
    
    # 👉 Use await with Motor
    result = await videos_collection.insert_one(video_data)
    
    return {"message": "Video uploaded successfully", "video_id": str(result.inserted_id)}

@router.get("/videos")
async def get_videos():
    videos = await videos_collection.find({}).to_list(length=None)

    # Convert ObjectId to string
    for video in videos:
        video["_id"] = str(video["_id"])

    return {"videos": videos}

# # Video Processing API
# @router.post("/process/{video_id}")
# async def process_video(video_id: str):
#     video = await videos_collection.find_one({"_id": ObjectId(video_id)})
#     if not video:
#         raise HTTPException(status_code=404, detail="Video not found")

#     cap = cv2.VideoCapture(video["filepath"])
#     frame_number = 0
#     results_to_store = []

#     # Define output video path
#     processed_video_path = os.path.join(RESULT_DIR, f"{video_id}.mp4")
#     fourcc = cv2.VideoWriter_fourcc(*"mp4v")
#     out = cv2.VideoWriter(processed_video_path, fourcc, 30.0, (int(cap.get(3)), int(cap.get(4))))

#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         # Convert BGR to RGB
#         img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = yolo_model(img)

#         for *box, conf, cls in results.xyxy[0]:
#             if int(cls) == 0:  # class 0 is 'person' in COCO dataset
#                 detection = {
#                     "video_id": video_id,
#                     "frame": frame_number,
#                     "bbox": [float(x) for x in box],
#                     "confidence": float(conf),
#                     "class": int(cls)
#                 }
#                 results_to_store.append(detection)

#                 # Draw bounding boxes
#                 x1, y1, x2, y2 = map(int, box)
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                 cv2.putText(frame, f"Person {conf:.2f}", (x1, y1 - 10),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

#         out.write(frame)
#         frame_number += 1

#     cap.release()
#     out.release()

#     if results_to_store:
#         await detections_collection.insert_many(results_to_store)

#     return {"message": "Video processed successfully", "processed_video": f"/static/results/{video_id}.mp4"}

async def reencode_video(input_path: str, output_path: str):
    process = await asyncio.create_subprocess_exec(
        "ffmpeg", "-i", input_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        output_path,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL
    )
    await process.communicate()

@router.post("/process/{video_id}")
async def process_video(video_id: str):
    video = await videos_collection.find_one({"_id": ObjectId(video_id)})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    cap = cv2.VideoCapture(video["filepath"])
    frame_number = 0
    results_to_store = []

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    result_filename = f"{video_id}.mp4"
    result_path = os.path.join(RESULT_DIR, result_filename)

    # Use avc1 (H.264) for better browser compatibility
    fourcc = cv2.VideoWriter_fourcc(*"avc1")
    out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = yolo_model(img_rgb)

        for *box, conf, cls in results.xyxy[0]:
            if int(cls) == 0:  # person
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"Person: {conf:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                results_to_store.append({
                    "video_id": video_id,
                    "frame": frame_number,
                    "bbox": [float(x) for x in box],
                    "confidence": float(conf),
                    "class": int(cls)
                })

        out.write(frame)
        frame_number += 1

    cap.release()
    out.release()

    # Re-encode to ensure browser playback
    reencoded_filename = f"reencoded_{video_id}.mp4"
    reencoded_path = os.path.join(RESULT_DIR, reencoded_filename)
    reencode_video(result_path, reencoded_path)

    if results_to_store:
        await detections_collection.insert_many(results_to_store)

    return {"message": "Video processed and saved", "video_path": f"/static/results/{reencoded_filename}"}

# API to Retrieve Detections
@router.get("/detections/{video_id}")
async def get_detections(video_id: str):
    detections = await detections_collection.find({"video_id": video_id}, {"_id": 0}).to_list(length=None)
    
    if not detections:
        raise HTTPException(status_code=404, detail="No detections found for this video")
    
    return {"video_id": video_id, "detections": detections}
