import { ApiResponse } from "../utils/api-response.js";

const healthCheck = (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "API is running" }));
};

export { healthCheck };
