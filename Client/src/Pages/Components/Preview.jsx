import React from "react";
import { useDispatch } from "react-redux";
import { downloadFile } from "../../store/fileSlice";
import "./Preview.css";

function ImagePreviewModal({ file, onClose }) {
  const dispatch = useDispatch();

  const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith("image/");
  };

  const getImageUrl = () => {
    if (file.filePath) {
      if (file.filePath.startsWith("/uploads")) {
        return `http://localhost:5000${file.filePath}`;
      }
      return file.filePath;
    }
    return "";
  };

  console.log(`http://localhost:5000${file.filePath}`);

  const handleDownload = () => {
    dispatch(downloadFile({ fileId: file.id, fileName: file.originalName }));
  };

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-preview-header">
          <h3>{file.originalName}</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="image-preview-content">
          {isImage(file.mimeType) ? (
            <img
              src={getImageUrl()}
              alt={file.originalName}
              className="preview-image"
            />
          ) : (
            <div className="file-preview-placeholder">
              <div className="file-icon-large">📄</div>
              <p>{file.originalName}</p>
              <p className="file-type">{file.mimeType || "Unknown type"}</p>
            </div>
          )}
        </div>

        <div className="image-preview-info">
          <div className="info-item">
            <span className="info-label">File Name:</span>
            <span className="info-value">{file.originalName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Size:</span>
            <span className="info-value">
              {(file.size / 1024).toFixed(2)} KB
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Uploaded:</span>
            <span className="info-value">
              {new Date(file.createdAt).toLocaleDateString()}{" "}
              {new Date(file.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="image-preview-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-download" onClick={handleDownload}>
            <i className="pi pi-download pr-1.5"></i>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImagePreviewModal;
