import axios from "axios";
import { useState, useCallback, useRef } from "react";
import "../css/FileUpload.css";
import { MIME_TYPES } from "../utils/const";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "webp",
  "pdf",
  "doc",
  "docx",
];
const DANGEROUS_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "com",
  "scr",
  "vbs",
  "js",
  "jar",
  "php",
  "py",
  "rb",
  "sh",
];

export default function FileUpload({
  targetFormat = "png",
  sourceFormat = "",
  endpoint = "img-convert",
  acceptedFormats = [],
  converterType = "",
  converterIndex = null,
}) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const validateFile = useCallback(
    (selectedFile) => {
      if (!selectedFile) {
        return ["No file selected"];
      }

      const errors = [];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      const fileType = selectedFile.type.toLowerCase();

      if (selectedFile.size > MAX_FILE_SIZE) {
        errors.push(
          `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
        );
      }

      if (selectedFile.size === 0) {
        errors.push("File appears to be empty");
      }

      if (fileExtension && DANGEROUS_EXTENSIONS.includes(fileExtension)) {
        errors.push("File type not allowed for security reasons");
        return errors;
      }

      if (sourceFormat === "pdf" || endpoint === "pdf-convert") {
        if (fileExtension !== "pdf" && !selectedFile.type.includes("pdf")) {
          errors.push("Please select a PDF file.");
        }
      } else if (sourceFormat === "image" && acceptedFormats.length > 0) {
        const isValidFormat = acceptedFormats.some((format) => {
          return (
            fileExtension === format.toLowerCase() ||
            fileType === MIME_TYPES[format.toLowerCase()] ||
            (format.toLowerCase() === "jpg" &&
              (fileExtension === "jpeg" || fileType === "image/jpeg"))
          );
        });

        if (!isValidFormat) {
          errors.push(
            `Please select one of these formats: ${acceptedFormats
              .join(", ")
              .toUpperCase()}. Selected file appears to be ${fileExtension?.toUpperCase()}.`
          );
        }
      } else if (sourceFormat && sourceFormat !== "image") {
        const isValidFormat =
          fileExtension === sourceFormat.toLowerCase() ||
          fileType === MIME_TYPES[sourceFormat.toLowerCase()] ||
          (sourceFormat.toLowerCase() === "jpg" &&
            (fileExtension === "jpeg" || fileType === "image/jpeg"));

        if (!isValidFormat) {
          errors.push(
            `Please select a ${sourceFormat.toUpperCase()} file. Selected file appears to be ${fileExtension?.toUpperCase()}.`
          );
        }
      }

      return errors;
    },
    [sourceFormat, endpoint, acceptedFormats]
  );

  const handleFileChange = useCallback(
    (e) => {
      try {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) {
          setFile(null);
          setError("");
          return;
        }

        const validationErrors = validateFile(selectedFile);
        if (validationErrors.length > 0) {
          setError(validationErrors.join(". "));
          setFile(null);
          return;
        }

        setFile(selectedFile);
        setError("");
        setStatus("idle");
      } catch (err) {
        console.error("Error handling file change:", err);
        setError("Error processing selected file");
        setFile(null);
      }
    },
    [validateFile]
  );

  const getFormDataKey = useCallback(() => {
    if (sourceFormat === "pdf" || endpoint === "pdf-convert") {
      return "uploaded_pdf";
    }
    return "uploaded_img";
  }, [sourceFormat, endpoint]);

  const handleFileUpload = useCallback(async () => {
    if (!file || isUploading) return;

    try {
      setIsUploading(true);
      setStatus("uploading");
      setUploadProgress(0);
      setError("");

      abortControllerRef.current = new AbortController();

      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(". "));
      }

      const formData = new FormData();
      const formDataKey = getFormDataKey();

      formData.append(formDataKey, file);
      formData.append("convertTo", targetFormat);

      console.log(`Uploading to endpoint: ${endpoint}`);
      console.log(`Using FormData key: ${formDataKey}`);
      console.log(`Converting to: ${targetFormat}`);

      const response = await axios.post(
        `http://localhost:8888/${endpoint}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 300000,
          signal: abortControllerRef.current.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        }
      );

      console.log(response);

      if (!response.data) {
        throw new Error("Empty response from server");
      }

      const {
        success,
        error: apiError,
        download_link,
        input_filename,
      } = response.data;

      if (!success) {
        throw new Error(apiError || "Conversion failed");
      }

      if (!download_link) {
        throw new Error("Download link missing in response");
      }

      await handleDownloads(download_link);

      setStatus("success");
      setUploadProgress(100);
    } catch (error) {
      console.error("Upload failed:", error);
      handleUploadError(error);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [file, isUploading, validateFile, getFormDataKey, endpoint, targetFormat]);

  const handleDownloads = async (downloadLinks) => {
    const links = Array.isArray(downloadLinks)
      ? downloadLinks
      : [downloadLinks];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      try {
        if (!link || typeof link !== "string") {
          throw new Error("Invalid download link");
        }

        const cleanLink = link.startsWith("/") ? link.substring(1) : link;
        const downloadUrl = `http://localhost:8888/${cleanLink}`;

        console.log(`Downloading from: ${downloadUrl}`);

        // Download file with timeout
        const fileResponse = await axios.get(downloadUrl, {
          responseType: "blob",
          timeout: 60000,
        });

        if (!fileResponse.data || fileResponse.data.size === 0) {
          throw new Error("Empty file received");
        }

        const { mimeType, fileName } = generateSafeFileName(link, i);

        const blob = new Blob([fileResponse.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.error(`Download failed for file ${i + 1}:`, downloadError);
        throw new Error(
          `Failed to download file ${i + 1}: ${downloadError.message}`
        );
      }
    }
  };

  const generateSafeFileName = (link, index) => {
    let mimeType, fileExtension, fileName;

    if (targetFormat === "docx") {
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileExtension = "docx";
      fileName = link.split("/").pop() || `converted_document.${fileExtension}`;
    } else if (targetFormat === "images" && endpoint === "pdf-convert") {
      mimeType = "image/jpeg";
      fileExtension = "jpg";
      fileName =
        link.split("/").pop() || `converted_page_${index + 1}.${fileExtension}`;
    } else {
      mimeType =
        MIME_TYPES[targetFormat.toLowerCase()] || `image/${targetFormat}`;
      fileExtension = targetFormat;
      fileName = link.split("/").pop() || `converted_file.${fileExtension}`;
    }

    return { mimeType, fileName };
  };

  const handleUploadError = (error) => {
    setStatus("error");
    setUploadProgress(0);

    if (error.name === "AbortError") {
      setError("Upload was cancelled");
      return;
    }

    if (error.code === "ECONNABORTED") {
      setError("Request timed out. Please try again.");
      return;
    }

    if (error.response) {
      const status = error.response.status;
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Server error";

      switch (status) {
        case 413:
          setError("File too large. Please select a smaller file.");
          break;
        case 415:
          setError("File type not supported by server.");
          break;
        case 429:
          setError("Too many requests. Please wait and try again.");
          break;
        case 500:
          setError("Server error. Please try again later.");
          break;
        default:
          setError(`Server error (${status}): ${errorMessage}`);
      }
    } else if (error.request) {
      setError(
        "Network error: Unable to reach the server. Please check your connection."
      );
    } else {
      setError(
        error.message || "An unexpected error occurred during conversion"
      );
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStatus("idle");
    setUploadProgress(0);
    setError("");
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAcceptAttribute = () => {
    if (sourceFormat === "pdf" || endpoint === "pdf-convert") {
      return "application/pdf,.pdf";
    } else if (sourceFormat === "image" && acceptedFormats.length > 0) {
      return acceptedFormats
        .map((format) => {
          if (format === "jpg") return "image/jpeg,.jpg,.jpeg";
          return `image/${format},.${format}`;
        })
        .join(",");
    } else if (sourceFormat && sourceFormat !== "image") {
      if (sourceFormat === "jpg") return "image/jpeg,.jpg,.jpeg";
      return `image/${sourceFormat},.${sourceFormat}`;
    }
    return "image/*";
  };

  const getFileInputHint = () => {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    const baseHint = `Max file size: ${maxSizeMB}MB. `;

    if (sourceFormat === "pdf" || endpoint === "pdf-convert") {
      return (
        baseHint +
        `Select a PDF file to convert to ${targetFormat.toUpperCase()}`
      );
    } else if (sourceFormat === "image" && acceptedFormats.length > 0) {
      return (
        baseHint +
        `Select an image file (${acceptedFormats
          .join(", ")
          .toUpperCase()}) to convert to ${targetFormat.toUpperCase()}`
      );
    } else if (sourceFormat && sourceFormat !== "image") {
      return (
        baseHint +
        `Select a ${sourceFormat.toUpperCase()} file to convert to ${targetFormat.toUpperCase()}`
      );
    }
    return (
      baseHint + `Select a file to convert to ${targetFormat.toUpperCase()}`
    );
  };

  const getConversionDescription = () => {
    if (endpoint === "pdf-convert") {
      if (targetFormat === "docx") return "PDF → DOCX";
      if (targetFormat === "images") return "PDF → Images";
    }
    return `${
      sourceFormat?.toUpperCase() || "File"
    } → ${targetFormat.toUpperCase()}`;
  };

  return (
    <div className="uploader-container">
      <div className="converter-info">
        <h3>File Converter</h3>
        <p>
          <strong>Converting:</strong> {getConversionDescription()}
        </p>
        {converterType && (
          <p>
            <strong>Converter:</strong> {converterType}
          </p>
        )}
        {acceptedFormats.length > 0 && (
          <p>
            <strong>Accepted formats:</strong>{" "}
            {acceptedFormats.join(", ").toUpperCase()}
          </p>
        )}
      </div>

      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={getAcceptAttribute()}
          disabled={isUploading}
          aria-label="Select file for conversion"
        />
        <p className="file-input-hint">{getFileInputHint()}</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
        </div>
      )}

      {file && (
        <div className="file-details">
          <h4>File Details:</h4>
          <p>
            <strong>File name:</strong> {file.name}
          </p>
          <p>
            <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p>
            <strong>Type:</strong> {file.name.split(".").pop()?.toUpperCase()}
          </p>
          <p>
            <strong>Will convert to:</strong> {targetFormat.toUpperCase()}
          </p>
        </div>
      )}

      {status === "uploading" && (
        <div className="progress-wrapper">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="progress-text">Converting... {uploadProgress}%</p>
          <button
            className="cancel-button"
            onClick={cancelUpload}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {file && status !== "uploading" && (
        <div className="action-buttons">
          <button
            className="upload-button"
            onClick={handleFileUpload}
            disabled={!!error || isUploading}
            type="button"
          >
            Convert to {targetFormat.toUpperCase()}
          </button>
          <button className="reset-button" onClick={resetUpload} type="button">
            Reset
          </button>
        </div>
      )}

      {status === "success" && (
        <div className="success-message" role="alert">
          <p className="success-text">✅ File converted successfully!</p>
          <p>
            Your converted {targetFormat.toUpperCase()} file(s) have been
            downloaded.
          </p>
          <button className="reset-button" onClick={resetUpload} type="button">
            Convert Another File
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="error-message" role="alert">
          <p className="error-text">❌ Conversion failed</p>
          <p>{error || "Please try again with a different file."}</p>
          <button
            className="retry-button"
            onClick={() => setStatus("idle")}
            type="button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
