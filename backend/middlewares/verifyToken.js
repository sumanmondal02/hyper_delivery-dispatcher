import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

export const verifyToken = async(req,res,next)=>{
    try{
      const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
      if(!token){
          return res.status(401).json({
            success: false,
            message:"Authentication failed: No token provided"
          });
      }
      let decoded; 
      try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch(err){
        const message = err.name === 'TokenExpiredError'
            ? 'Session expired — please log in again' : 'Invalid token';
        return res.status(401).json({ success: false, message });
      }
      const user = await UserModel.findById(decoded.id).select("-password -createdAt -updatedAt");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication failed: User not found",
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Authentication failed: User not active",
        });
      }
      req.user = user;
      next();
    } catch(err){
        next(err);
    }
}

export const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${roles.join(' or ')} only`,
      });
    }
    next();
  };
};

export const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        console.error(err);
    }
    // validation error
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
        return res.status(400).json({ success: false, message: firstError});
    }
    // cast error
    if (err.name === "CastError") {
        return res.status(400).json({ 
            success: false,
            message: "Cast error occurred", 
            error: `Invalid ${err.path}: ${err.value}` 
        });
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
        message: "Invalid token"
        });
    }
    // Token expired error
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired"
        });
    }
    // Mongoose strict mode error
    if (err.name === "StrictModeError") {
      return res.status(400).json({ 
          success: false,
          message: "Invalid fields in request", 
          error: err.message 
      });
    }
    // duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(409).json({ 
            success: false,
            message: "Duplicate key error occurred", 
            error: `${field} "${value}" already exists` 
        });
    }
    //CORS error
    if (err.message?.startsWith("CORS blocked")) {
      return res.status(403).json({ success: false, message: "CORS: Origin not allowed" });
    }
    // Multer error
    if (err.message === "Only JPG and PNG allowed") {
        return res.status(400).json({ success: false, message: err.message });
    }
    // Multer file size error
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File size cannot exceed 10MB" });
    }
    // Multer unexpected field
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}` });
    }
    // send server error
    return res.status(500).json({ 
        success: false,
        message: "Server side error occurred", 
        error: "Server side error",
        ...(process.env.NODE_ENV === 'development' && { debug: err.message }),
    });
};