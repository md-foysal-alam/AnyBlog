// Copyright 2026 Foysal Alam Rohan

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import express from "express";

export const errorHandler = (
  err   : any,
  _req  : express.Request,
  res   : express.Response,
  _next : express.NextFunction
) => {
  console.error("Error:", err);

  let statusCode = parseInt(err.statusCode || err.status, 10);
  
  if (isNaN(statusCode)) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    success       : false,
    message       : err.message || "Internal server error",
    errorDetails  : typeof err.status === 'string' ? err.status : undefined 
  });
};