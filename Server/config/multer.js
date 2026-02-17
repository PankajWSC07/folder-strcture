const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../Uploads");
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExt);
    cb(null, `${fileName}-${uniqueSuffix}${fileExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ALLOWED_MIMETYPES = [
    // Text & Code
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/typescript",

    // Documents
    "application/pdf",
    "application/msword",
    "text/csv",

    // Images
    "image/jpeg",
    "image/png",
    "image/gif",

    // Programming Languages
    "text/x-javascript",
    "text/x-python",
    "text/x-java",
    "text/x-c",
    "text/x-cpp",
  ];

  const ALLOWED_EXTENSIONS = [
    // Programming Languages
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".php",

    // Markup & Web
    ".html",

    ".css",

    ".json",

    // Documents & Text
    ".pdf",
    ".txt",
    ".md",
    ".tex",
    ".doc",
    ".docx",
    ".csv",
    ".tsv",
    ".xlsx",
    ".xls",
    ".pptx",
    ".ppt",

    // Images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ];

  const fileName = file.originalname.toLowerCase();
  const fileExt = "." + fileName.split(".").pop();

  const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
  const isAllowedMimeType =
    ALLOWED_MIMETYPES.includes(file.mimetype) ||
    file.mimetype.startsWith("text/") ||
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("application/");

  if (isAllowedExt || isAllowedMimeType) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

exports.upload = upload;