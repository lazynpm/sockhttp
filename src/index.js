const http = require("http");
const parser = require('./parser');
const reader = require('./reader');
const addons = require('./addons');

let server;

function host() {
  // This will have mapping of all routes with their respective callback, middleware and other information
  let routeTable = {};
  // Using JSON as default parsing method
  let parseMethod = "json";
  // This will have list of middleware functions to be applied to all endpoints
  let defaultMiddleware = [];
  // Flag to check if CORS is enabled or not
  let enableCORSSettings = false;
  // List of Methods that are allowed on an API (GET, POST, DELETE, etc)
  let allowedMethods = [];
  // Settings for CORS which will be added to the headers
  let corsSettings = {};
  // Will contain headers for response
  let headers = {};

  // Register paths to route table 
  function registerPath(path, cb, method, middleware) {
    if (!routeTable[path]) {
      routeTable[path] = {};
    }
    // Adding call back and middleware to route table
    routeTable[path] = {
      ...routeTable[path], 
      [method]: cb, // Will save as "get": function() {}
      [method + "-middleware"]: [ // will save as "get-middleware": [function() {}, function() {}]
        ...defaultMiddleware, // Adding default middleware to all end points
        middleware
      ]
    };
  }

  // Add default middleware to default middleware array
  function addDefaultMiddleware(callback) {
    if (callback) {
      defaultMiddleware = [
        ...defaultMiddleware,
        callback
      ]
    }
  }

  // Enable CORS settings by adding it to corsSettings Object
  function useCORS(origin, headers, maxAge) {
    enableCORSSettings = true;
    // Add origin
    if (origin) {
      corsSettings = {
        ...corsSettings,
        'Access-Control-Allow-Origin': origin
      }
    }
    // Add headers if availble
    if (headers) {
      allowedMethods = headers.split(',')
      corsSettings = {
        ...corsSettings,
        'Access-Control-Allow-Methods': headers
      }
    } else { // otherwise add all other headers
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

  // Add custom headers to headers object
  function addHeaders(key, value) {
    headers[key] = value;
  }

  server = http.createServer(async (req, res) => {
    // Get all keys (i.e. paths for endpoints)
    const routes = Object.keys(routeTable);

    // flag to see if requested URL is available or not
    let match = false;

    // adding CORS headers to headers
    const headers = {
      ...corsSettings
    }

    // Add CORS Settings if CORS is enables
    if (enableCORSSettings) {
      // Check if request Method is registered in CORS policy ot not
      if (allowedMethods.indexOf(req.method) > -1) {
        for (const [key, value] of Object.entries(corsSettings)) {
          res.setHeader(key, value);
        }
        res.statusCode = 200;
      } 
      //  Else, reject the request and send appropriate message
      else {
        for (const [key, value] of Object.entries(corsSettings)) {
          res.setHeader(key, value);
        }
        res.statusCode = 405;
        res.end(`${req.method} is not allowed for the request.`);
        return;
      }
    }
    // Pasring through routes list
    for (var i = 0; i < routes.length; i++) {
      const route = routes[i];
      const parsedRoute = parser.parseURL(route);
      // If request URL matches regex and is present in route table
      if (
        new RegExp(parsedRoute).test(req.url) &&
        routeTable[route][req.method.toLowerCase()]
      ) {
        // Get callback function from mapping object
        let callback = routeTable[route][req.method.toLowerCase()];

        // Get any middleware is applied
        let middlewares = routeTable[route][`${req.method.toLowerCase()}-middleware`];

        const matchRegex = req.url.match(new RegExp(parsedRoute));

        // Get request params from parsed URL
        req.params = matchRegex.groups;
        // Get query param from parsed URL
        req.query = parser.parseQuery(req.url);

        // Read body from request
        let body = await reader.readBody(req);

        // Parse body in JSON
        if (parseMethod === "json") {
          body = body ? JSON.parse(body) : {};
        }

        req.body = body;

        // Process request
        const result = await reader.processMiddleware(middlewares, req, reader.createResponse(res));
        
        // Call callback function for request
        if (result) {
          callback(req, res);
        }

        // Set match was met
        match = true;

        // END LOOP
        break;
      }
    }
    // SEND 404 if not found
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