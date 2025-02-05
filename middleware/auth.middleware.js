import AppError from "../utils/appError.js";
import JWT from "jsonwebtoken";

export  const isLoggedIn = function (req, res, next) {
  const { token } = req.cookies;
  // console.log("TOKEN",token)

  if (!token) {
    return next(new AppError("Unauthenticated, please login", 401));
  }

  const tokenDetails = JWT.verify(token, process.env.JWT_SECRET);
  if (!tokenDetails) {
    return next(new AppError("Unauthenticated, please login", 401));
  }
  req.user = tokenDetails;
  next();
};



export const authorizeRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentRole = req.user.role;

    if (!roles.includes(currentRole)) {
      return next(
        new AppError("You do not have permission to access this routes", 401)
      );
    }

    next();
  };


  export const authorizeSubscribers =(req,res,next)=>{
  const subscriptionStatus = req.user.subscription.status;
  const currentRole = req.user.role;

  if(currentRole !=='ADMIN' && subscriptionStatus !== 'active'){
    return next(new AppError('Please subscribe to access this route',400))
  }
  
  
    next();
  }

