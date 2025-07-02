import AppError from "../utils/error.util";
import  jwt from "jsonwebtoken";
const isLoggedIn = async(req, res, next) => {
    const {token} = req.cookies;
    if(!token){
        return next(new AppError("unauthenticated, please login again,400"))
    }
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET)
    next()
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
export {
    isLoggedIn,
    authorisedRoles
}