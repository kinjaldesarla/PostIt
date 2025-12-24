import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from'jsonwebtoken'  
import { ApiError } from "../utils/ApiError";
import { IUser, User } from "../models/user.model";


// Extend Request type to include "user"
interface AuthRequest extends Request {
  user?: IUser;
}

export const verifyjwt = async (req: AuthRequest, _: Response, next: NextFunction) => {
 try {
    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if(!token){
        throw new ApiError(401, "Unauthorized request");
    }
    const decoedToken = jwt.verify(
    token, process.env.ACCESS_TOKEN_SECRET as string  
    ) as JwtPayload & { id: string };
    
    const user = await User.findById(decoedToken.id)
     if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
};
