export interface IPost {
  _id: string;
  post: string[];       
  postComment: string[];     
  postLike: string[]; 
  likesCount:number;
  commentsCount:number     
}
export interface UserProfile{
    profile:{
     fullname:string,
    username:string,
    bio:string,
    followers:string[],
    following:string[],
    profilePhoto:string,
     savedPost:IPost[],
     isPrivate:boolean
    }
    posts:IPost[],
     totalPost:number,
}

export interface EditUserProfile{
     fullname:string,
    username:string,
    bio:string,
    profilePhoto:File | string | null,
    isPrivate:boolean,
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
}

export interface Notify{
  sender:{_id:string,profilePhoto:string,username:string},
  status:'accepted'|'pending',
  type:'follow',
  user:string
}