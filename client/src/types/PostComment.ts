export interface Post {
  likedByUser:boolean
  _id: string;
  caption: string;
  post: string[];
  postOwner: {
    _id: string;
    username: string;
    profilePhoto: string;
    isPrivate: boolean;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByUser: boolean;
  activeIndex?: number;
 postComment?: Comment[];
}

export interface Comment {
  _id: string;
  comment: string;
  commentOwner: {
    username: string;
    profilePhoto: string;
    _id:string
  };
  createdAt: string;
  likesCount?: number;
  likedByUser?: boolean;
}
