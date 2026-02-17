import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile, clearSuccess, clearError } from "../../store/fileSlice";
import "./FileUpload.css";

function FileUpload({ parentId, onUploadSuccess }) {
  const dispatch = useDispatch();
  const { loading, error, success, uploadProgress } = useSelector(
    (state) => state.file,
  );

  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = [
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".rb",
    ".go",
    ".rs",
    ".php",
    ".html",
    ".css",
    ".scss",
    ".xml",
    ".json",
    ".yaml",
    ".txt",
    ".md",
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".zip",
    ".rar",
    ".7z",
    ".doc",
    ".docx",
    ".xlsx",
    ".pptx",
  ];

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File ${file.name} exceeds 50MB limit`);
      return false;
    }

    const fileName = file.name.toLowerCase();
    const fileExt = "." + fileName.split(".").pop();

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setFileError(`File type not allowed for ${file.name}`);
      return false;
    }

    setFileError(null);
    return true;
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = [];

      for (const file of files) {
        if (validateFile(file)) {
          validFiles.push(file);
        } else {
          return;
        }
      }

      if (validFiles.length > 0) {
        setSelectedFiles([...selectedFiles, ...validFiles]);
      }
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setFileError("Please select at least one file");
      return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const resultAction = await dispatch(uploadFile({ file, parentId }));
      
      if (!uploadFile.fulfilled.match(resultAction)) {
        setFileError(`Failed to upload ${file.name}`);
        return;
      }

      if (i === selectedFiles.length - 1 && onUploadSuccess) {
        onUploadSuccess(resultAction.payload);
      }
    }

    setSelectedFiles([]);
    setShowModal(false);

    setTimeout(() => {
      dispatch(clearSuccess());
    }, 3000);
  };

  const handleCloseModal = () => {
    if (!loading) {
      setSelectedFiles([]);
      setFileError(null);
      setShowModal(false);
      dispatch(clearError());
    }
  };

  return (
    <div className="file-upload-container">
      <button
        className="action-icon-btn upload-icon"
        title="Upload file"
        onClick={() => setShowModal(true)}
        disabled={loading}
      >
        📤
      </button>

      {showModal && (
        <div className="file-upload-modal-overlay" onClick={handleCloseModal}>
          <div
            className="file-upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="file-upload-modal-header">
              <h3>Upload File</h3>
              <button
                className="close-btn"
                onClick={handleCloseModal}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="file-upload-modal-content">
              {/* Success Message */}
              {success && (
                <div className="alert alert-success">
                  ✓ File uploaded successfully!
                </div>
              )}

              {/* Error Message */}
              {error && <div className="alert alert-error">✗ {error}</div>}
              {fileError && (
                <div className="alert alert-error">✗ {fileError}</div>
              )}

              <div
                className={`file-area  ${selectedFiles.length > 0 ? "has-file" : ""}`}
              >
                {selectedFiles.length > 0 ? (
                  <div className="file-list-container">
                    <div className="file-list">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="file-preview">
                          <div className="file-icon">📄</div>
                          <div className="file-info">
                            <p className="file-name">{file.name}</p>
                            <p className="file-size">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile(index)}
                            disabled={loading}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="add-more-files">
                      + Add more files
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        disabled={loading}
                        className="file-input"
                        multiple
                      />
                    </label>
                  </div>
                ) : (
                  <div className="file-drop-content">
                    <div className="drag-icon">📁</div>
                    <p className="drag-text">select your files here</p>

                    <label className="file-input-label">
                      Click to browse
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        disabled={loading}
                        className="file-input"
                        multiple
                      />
                    </label>
                    <p className="file-size-info">
                      Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="file-upload-actions">
                <button
                  className="btn btn-cancel"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-upload"
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || loading}
                >
                  {loading
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
