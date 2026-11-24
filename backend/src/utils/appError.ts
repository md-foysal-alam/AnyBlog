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

class appError extends Error {
  
  public readonly statusCode    : number;
  public readonly status        : 'fail' | 'error';
  public readonly isOperational : boolean; 

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // 1. Fix standard JS class extension behaviors (for compilation targets < ES2015)
    Object.setPrototypeOf(this, new.target.prototype);

    // 2. Clear class name assignment
    this.name = this.constructor.name;

    // 3. Safe environment check for V8 engines (Node.js/Chrome)
    if ('captureStackTrace' in Error && typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      // Production fallback for other environments
      this.stack = new Error(message).stack ?? "";
    }
  }

}

export default appError;