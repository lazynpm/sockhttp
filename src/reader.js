
function createResponse(res) {
  res.send = (message) => res.end(message);
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  return res;
};

function processMiddleware(middlewares, req, res) {
  if (middlewares.length == 0) {
    return new Promise((resolve) => resolve(true));
  }
  middlewarePromise = [];
  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    if(middleware) {
      middlewarePromise.push(new Promise((resolve) => {
        middleware(req, res, function () {
          resolve(true);
        });
      }));
    }
  }
  return Promise.all(middlewarePromise)
};

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