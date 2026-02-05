import { ApiError } from "./apiError.js";
import { User } from "../model/user.model.js";

export const checkUserLoginStatus = (user) => {
  if (user.isBlocked) {
    throw new ApiError(403, "You are blocked by admin");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError(403, "Account locked. Try again later");
  }
};


export const handleFailedLogin = async (user) => {
  const updates = {
    $inc: { loginAttempts: 1 }
  };

  if (user.loginAttempts + 1 >= 5) {
    updates.$set = {
      lockUntil: Date.now() + 10 * 60 * 1000 
    };
  }

  await User.updateOne({ _id: user._id }, updates);
};

