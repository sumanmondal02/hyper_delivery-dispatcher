import exp from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "./config/scheduledPostWorker.js";
import {config} from "dotenv";
import {connect} from "mongoose";
import {userRoute} from "./APIs/userRoute.js";
import {postRoute} from "./APIs/postRoute.js";
import {adminRoute} from "./APIs/adminRoute.js";
import {commonRoute} from "./APIs/commonRoute.js";
import {notificationRoute} from "./APIs/notificationRoute.js"
import {errorHandler} from './middlewares/verifyToken.js'

config();

// create express app
const app = exp();

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
];

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      return callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));

// cookie parser middleware
app.use(cookieParser());

// JSON body parser middleware
app.use(exp.json());

//path for routes
app.use("/user-api", userRoute) 
app.use("/post-api", postRoute)
app.use("/admin-api", adminRoute)
app.use("/notification-api", notificationRoute)
app.use("/auth", commonRoute)

// connect to MongoDB
const connectDB = async () => {
    try {
        await connect(process.env.DB_URL, {dbName: "twitter_clone"});
        console.log("Database Connected");
        const PORT = process.env.PORT || 6436;
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

// Testing API working or not 
// app.get("/", (req, res) => {
//     res.send("Blog API is running");
// }); 

//to handle invalid path
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "development") console.log("404:", req.url)
    res.status(404).json({message: `Path ${req.url} is invalid`})
})

app.use(errorHandler);

connectDB();

export default app;