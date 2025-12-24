class ApiError extends Error{
    public readonly stautscode:number;
    public readonly message:string;
    public readonly errors:string[];
    public readonly success: boolean;
    public readonly data:null;
    constructor(
        stautscode:number,
        message="something went wrong",
        errors=[],
        stack=''
    ){
        super(message),
        this.stautscode=stautscode,
        this.errors=errors,
        this.success=false,
        this.message=message,
        this.data=null

        if(stack){
         this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}