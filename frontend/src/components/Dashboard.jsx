import React, { useState } from "react";
import axios from "axios";
import "../App.css";

export default function Dashboard() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [file, setFile] = useState(null);
  const [videoId, setVideoId] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [processedVideoURL, setProcessedVideoURL] = useState("");
  const [detections, setDetections] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(detections.length / itemsPerPage);
  const paginatedDetections = detections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpload = async () => {
    if (!file) return alert("Please select a video first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setStatusMessage("Uploading video...");

      const res = await axios.post(`${API_URL}/upload/`, formData);
      const { video_id } = res.data;

      setVideoId(video_id);
      setVideoURL(URL.createObjectURL(file));
      setProcessedVideoURL("");
      setDetections([]);
      setStatusMessage("✅ Upload complete! Ready to process.");
    } catch (err) {
      console.error("Upload Error:", err);
      setStatusMessage("❌ Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!videoId) return;

    try {
      setIsProcessing(true);
      setStatusMessage("🔄 Processing video, please wait...");

      await axios.post(`${API_URL}/process/${videoId}`);

      const res = await axios.get(`${API_URL}/detections/${videoId}`);
      setDetections(res.data.detections || []);
      setProcessedVideoURL(`${API_URL}/static/results/${videoId}.mp4`);
      setStatusMessage("✅ Processing complete! Scroll down to see results.");
    } catch (err) {
      console.error("Processing Error:", err);
      setStatusMessage("❌ Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-10">
          🎥 Object Detection
        </h1>

        {/* Upload Section */}
        {statusMessage && (
          <div className="mt-4 mb-2 text-center text-sm text-blue-700 font-medium animate-pulse">
            {statusMessage}
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="p-2 border rounded-md w-full md:w-auto"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`${
                  isUploading
                    ? "bg-blue-400 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white px-5 py-2 rounded-md flex items-center gap-2`}
              >
                {isUploading && <span className="loader"></span>}
                {isUploading ? "Uploading..." : "Upload"}
              </button>

              <button
                onClick={handleProcess}
                disabled={!videoId || isProcessing}
                className={`${
                  !videoId || isProcessing
                    ? "bg-green-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-5 py-2 rounded-md flex items-center gap-2`}
              >
                {isProcessing && <span className="loader"></span>}
                {isProcessing ? "Processing..." : "Process"}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Before vs After */}
        {videoURL && processedVideoURL && (
          <div className="bg-white p-6 rounded-2xl shadow-md border mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              🎬 Before vs After Processing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 text-center">
                  🔵 Original Video
                </h3>
                <video
                  src={videoURL}
                  controls
                  className="w-full rounded-lg shadow-md"
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-3 text-center">
                  🟢 Processed Output
                </h3>
                <video
                  src={processedVideoURL}
                  controls
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Detection Results Table */}
        {detections.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-md border">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
              📊 Object Detection Results
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-gray-300 rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Frame</th>
                    <th className="px-4 py-2 border">Confidence</th>
                    <th className="px-4 py-2 border">Bounding Box</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDetections.map((d, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{d.frame}</td>
                      <td className="px-4 py-2 border">
                        {d.confidence.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border">
                        [{d.bbox.map((x) => x.toFixed(1)).join(", ")}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center mt-4 gap-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium self-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Original vs Processed Static Preview */}
        <div className="bg-white p-6 rounded-2xl shadow-md border mb-10 mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              🎬 Demo
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 text-center">
                🔵 Original Video
              </h3>
              <video
                src="https://object-detection-4-tu7z.onrender.com/static/uploads/e7a5e939-bc74-4da7-8815-b51aa1545767.mp4"
                controls
                autoPlay
                muted
                loop
                className="rounded-lg shadow-md w-full h-64 object-contain"
              />
            </div>

            {/* Processed */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-3 text-center">
                🟢 Processed Output
              </h3>
              <video
                src="https://object-detection-4-tu7z.onrender.com/static/results/67f03f89249fdcb690d6b30d.mp4"
                controls
                autoPlay
                muted
                loop
                className="rounded-lg shadow-md w-full h-64 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
