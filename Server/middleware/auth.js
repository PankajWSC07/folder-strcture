const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kjfdnkdjnmdplkmnbvs");
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;


exports.checkPermission = (req, res, next) => {
  const { folderId } = req.params;
  const userId = req.userId;
  const {folderUserId} = req.folderUserId; 

  if (!folderId || !userId) {
    return res.status(400).json({ message: "Folder or user ID is missing" });
  }


  if(userId !== folderUserId){
    return res.status(400).json({ message: "You do not have access to this folder" });
  }
 
  
   
  

  const hasPermission =  true;
  if (!hasPermission) {
    return res.status(403).json({ message: "You do not have permission to share this folder" });
  }
  next();
};