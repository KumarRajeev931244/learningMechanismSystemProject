import AppError from "../utils/error.util.js";
import  jwt from "jsonwebtoken";
const isLoggedIn = async(req, res, next) => {
    const {token} = req.cookies;
    if(!token){
        return next(new AppError("unauthenticated, please login again,400"))
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (error, userDetails) => {
        if (error) {
            return next(new AppError("unauthenticated, please login again", 400))
        }
        req.user = userDetails;
        next()
    })
}

const authorisedRoles = (...roles) => async(req, res, next) =>{
    const currentUserRoles = req.user.role;
    if(!roles.includes(currentUserRoles)){
        return next(
            new AppError('you do not have permission to access this route', 403)
        )
    }
    next()

}

const authorisedSubcriber = async(req, res, next) =>{
    const subscription = req.user.subscription;
    const currentUserRoles = req.user.role;
    if(currentUserRoles !== 'ADMIN' && subscription.status !== 'active'){
        return next(
            new AppError('please subscribe to access this route', 403)
        )
    }
    next()

}
export {
    isLoggedIn,
    authorisedRoles,
    authorisedSubcriber
}