import jwt from "jsonwebtoken";
import {config} from "dotenv";
import {UserModel} from "../models/UserModel.js";

config();

export const verifyToken = async(req,res,next)=>{
    try{
    const token=req.cookies?.token;
    if(!token){
        return res.status(401).json({message:"Authentication failed: No token provided"});
    }
    let decoded; 
    try{
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch(err){
        return res.status(401).json({message:"Authentication failed: Invalid or expired token"});
    }
    const user = await UserModel.findById(decoded.id).select("-password -createdAt -updatedAt");
    if (!user) {
      return res.status(404).json({
        message: "Authentication failed: User not found",
      });
    }
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Authentication failed: User is blocked",
      });
    }
    if (user.isDeactivated) {
      return res.status(403).json({
        message: "Authentication failed: User is not active",
      });
    }
    req.user = user;
    next();
    } catch(err){
        next(err);
    }
}

export const verifyAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Access denied: Admin only",
      });
    }
    next();
};

export const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        console.error(err);
    }
    // validation error
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
        return res.status(400).json({ message: firstError});
    }
    // cast error
    if (err.name === "CastError") {
        return res.status(400).json({ 
            message: "Cast error occurred", 
            error: `Invalid ${err.path}: ${err.value}` 
        });
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
        message: "Invalid token"
        });
    }
    // Token expired error
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
        message: "Token expired"
        });
    }
    // Mongoose strict mode error
    if (err.name === "StrictModeError") {
      return res.status(400).json({ 
          message: "Invalid fields in request", 
          error: err.message 
      });
    }
    // duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(409).json({ 
            message: "Duplicate key error occurred", 
            error: `${field} "${value}" already exists` 
        });
    }
    //CORS error
    if (err.message?.startsWith("CORS blocked")) {
      return res.status(403).json({ message: "CORS: Origin not allowed" });
    }
    // Multer error
    if (err.message === "Only JPG and PNG allowed") {
        return res.status(400).json({ message: err.message });
    }
    // Multer file size error
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size cannot exceed 25MB" });
    }
    // Multer unexpected field
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: `Unexpected file field: ${err.field}` });
    }
    // send server error
    return res.status(500).json({ 
        message: "Server side error occurred", 
        error: "Server side error" 
    });
};