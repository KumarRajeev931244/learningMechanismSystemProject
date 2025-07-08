import AppError from "../utils/error.util.js";
import  jwt from "jsonwebtoken";
const isLoggedIn = async(req, res, next) => {
    // check if token is present in cookies
    const {token} = req.cookies;
    if(!token){
        return next(new AppError("unauthenticated, please login again,400"))
    }
    // verify the token by using jwt
    jwt.verify(token, process.env.JWT_SECRET, (error, userDetails) => {
        if (error) {
            return next(new AppError("unauthenticated, please login again", 400))
        }
        // here we inject the user details into the request object
        // so that we can use it in the next middleware or controller
        req.user = userDetails; 
        next()
    })
}

const authorisedRoles = (...roles) => async(req, res, next) =>{
    // here we extract roles from the request object
    const currentUserRoles = req.user.role;
    // check if the current user role is included in the roles array
    // if not then we throw an error
    if(!roles.includes(currentUserRoles)){
        return next(
            new AppError('you do not have permission to access this route', 403)
        )
    }
    next()

}

const authorisedSubcriber = async(req, res, next) =>{
    // here we check if the user is a subscriber or not
    const subscription = req.user.subscription;
    const currentUserRoles = req.user.role;
    console.log("subscription:", subscription);
    console.log("currentUserRoles:", currentUserRoles);
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