
import express, { Application } from "express";
import connectMongoDB from './db/db';
import UserRoutes from './routes/user.routes'
import PostRoutes from './routes/post.routes'
import CommentRoutes from './routes/comment.routes'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from "cors";

const app: Application = express();

const corsOptions: CorsOptions = {
  origin: "http://localhost:5173", 
  credentials: true, 
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser())

app.use('/api/user',UserRoutes)
app.use('/api/post',PostRoutes)
app.use('/api/comment',CommentRoutes)

app.listen(PORT, () => {
    connectMongoDB();
    console.log(`Server is running on port ${PORT}...`);
});

