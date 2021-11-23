// Creating response
function createResponse(res) {
  // add res.send(message) to end with a message
  res.send = (message) => res.end(message);

  // add res.json(data) to add response data
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  return res;
};

// Processing multiple middlewares for a single endpoing
function processMiddleware(middlewares, req, res) {
  // return if no middleware are found
  if (middlewares.length == 0) {
    return new Promise((resolve) => resolve(true));
  }
  // add all middlewares to a array to resolve at last
  middlewarePromise = [];
  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    // if middleware
    if(middleware) {
      // push it to array 
      middlewarePromise.push(new Promise((resolve) => {
        middleware(req, res, function () {
          resolve(true);
        });
      }));
    }
  }
  // resolve all middlewares in sequential order
  return Promise.all(middlewarePromise)
};

// Read body from request
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += "" + chunk;
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = {
  readBody,
  createResponse,
  processMiddleware
};