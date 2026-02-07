class ApiError extends Error{
    constructor(
        statuscode,
        message="Something Went Wrong",
        error=[],
        stack=""
    ){
        super(message)
        this.statuscode = statuscode
        this.error = error
        this.message = message
        this.success = false
        this.stack = stack

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}