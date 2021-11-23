const http = require("http");
const parser = require('./parser');
const reader = require('./reader');
const addons = require('./addons');

let server;

function host() {
  let routeTable = {};
  let parseMethod = "json";
  let defaultMiddleware = [];
  let enableCORSSettings = false;
  let allowedMethods = [];
  let corsSettings = {};
  let headers = {};

  function registerPath(path, cb, method, middleware) {
    if (!routeTable[path]) {
      routeTable[path] = {};
    }
    routeTable[path] = {
      ...routeTable[path], [method]: cb,
      [method + "-middleware"]: [
        ...defaultMiddleware,
        middleware
      ]
    };
  }

  function addDefaultMiddleware(callback) {
    if (callback) {
      defaultMiddleware = [
        ...defaultMiddleware,
        callback
      ]
    }
  }

  function useCORS(origin, headers, maxAge) {
    enableCORSSettings = true;
    if (origin) {
      corsSettings = {
        ...corsSettings,
        'Access-Control-Allow-Origin': origin
      }
    }
    if (headers) {
      allowedMethods = headers.split(',')
      corsSettings = {
        ...corsSettings,
        'Access-Control-Allow-Methods': headers
      }
    } else {
      corsSettings = {
        ...corsSettings,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS, DELETE'
      }
    }
    if (maxAge) {
      corsSettings = {
        ...corsSettings,
        'Access-Control-Max-Age': maxAge
      }
    }
  }

  function addHeaders(key, value) {
    headers[key] = value;
  }

  server = http.createServer(async (req, res) => {
    const routes = Object.keys(routeTable);
    let match = false;
    const headers = {
      ...corsSettings
    }
    if (enableCORSSettings) {
      if (allowedMethods.indexOf(req.method) > -1) {
        for (const [key, value] of Object.entries(corsSettings)) {
          res.setHeader(key, value);
        }
        res.statusCode = 200;
      } else {
        for (const [key, value] of Object.entries(corsSettings)) {
          res.setHeader(key, value);
        }
        res.statusCode = 405;
        res.end(`${req.method} is not allowed for the request.`);
        return;
      }
    }
    for (var i = 0; i < routes.length; i++) {
      const route = routes[i];
      const parsedRoute = parser.parseURL(route);
      if (
        new RegExp(parsedRoute).test(req.url) &&
        routeTable[route][req.method.toLowerCase()]
      ) {
        let callback = routeTable[route][req.method.toLowerCase()];
        let middlewares = routeTable[route][`${req.method.toLowerCase()}-middleware`];

        const matchRegex = req.url.match(new RegExp(parsedRoute));

        req.params = matchRegex.groups;
        req.query = parser.parseQuery(req.url);

        let body = await reader.readBody(req);
        if (parseMethod === "json") {
          body = body ? JSON.parse(body) : {};
        }

        req.body = body;

        const result = await reader.processMiddleware(middlewares, req, reader.createResponse(res));
        if (result) {
          callback(req, res);
        }

        match = true;
        break;
      }
    }
    if (!match) {
      res.statusCode = 404;
      res.end("Not found");
    }
  });


  return {
    addDefaultMiddleware: (callback) => {
      addDefaultMiddleware(callback);
    },
    useLogger: () => {
      addDefaultMiddleware(addons.logger);
    },
    useCORS: (origin, methods, maxAge) => {
      useCORS(origin, methods, maxAge);
    },
    addHeader: (key, value) => {
      addHeaders(key, value);
    },
    get: (path, ...rest) => {
      if (rest.length === 1) {
        registerPath(path, rest[0], "get");
      } else {
        registerPath(path, rest[1], "get", rest[0]);
      }
    },
    post: (path, ...rest) => {
      if (rest.length === 1) {
        registerPath(path, rest[0], "post");
      } else {
        registerPath(path, rest[1], "post", rest[0]);
      }
    },
    put: (path, ...rest) => {
      if (rest.length === 1) {
        registerPath(path, rest[0], "put");
      } else {
        registerPath(path, rest[1], "put", rest[0]);
      }
    },
    delete: (path, ...rest) => {
      if (rest.length === 1) {
        registerPath(path, rest[0], "delete");
      } else {
        registerPath(path, rest[1], "delete", rest[0]);
      }
    },
    bodyParse: (method) => parseMethod = method,
    listen: (port, callback) => {
      server.listen(port, callback);
    },
    _server: server
  };
}

module.exports = host;