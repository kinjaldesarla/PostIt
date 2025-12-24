class ApiResponse<T>{
    public readonly stautscode:number;
    public readonly data:T;
    public readonly message:string;
    public readonly success: boolean;
    constructor(
        stautscode:number,
         data:T,
        message:string='success',
    ){
       this.stautscode=stautscode,
        this.data=data,
       this.message=message,
       this.success=stautscode < 400
    }
}

export {ApiResponse}