
// response send to backend
export interface SignupPayload {
    username:string,
    email:string,
    password:string,
    fullname:string
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

