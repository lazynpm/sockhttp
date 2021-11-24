const http = require("http");
const parser = require('./parser');
const reader = require('./reader');
const addons = require('./addons');

class Host {

  constructor() {
    Object.assign(this, {
      // This will have mapping of all routes with their respective callback, middleware and other information
      routeTable: {},
      // Using JSON as default parsing method
      parseMethod: "json",
      // This will have list of middleware functions to be applied to all endpoints
      defaultMiddleware: [],
      // Flag to check if CORS is enabled or not
      enableCORSSettings: false,
      // List of Methods that are allowed on an API (GET, POST, DELETE, etc)
      allowedMethods: [],
      // Settings for CORS which will be added to the headers
      corsSettings: {},
      // Will contain headers for response
      headers: {},
      // server
      server: http.createServer(async (req, res) => {
        // Get all keys (i.e. paths for endpoints)
        const routes = Object.keys(this.routeTable);

        // flag to see if requested URL is available or not
        let match = false;

        // adding CORS headers to headers
        const headers = {
          ...this.corsSettings
        }

        // Add CORS Settings if CORS is enables
        if (this.enableCORSSettings) {
          // Check if request Method is registered in CORS policy ot not
          if (this.allowedMethods.indexOf(req.method) > -1) {
            for (const [key, value] of Object.entries(this.corsSettings)) {
              res.setHeader(key, value);
            }
            res.statusCode = 200;
          }
          //  Else, reject the request and send appropriate message
          else {
            for (const [key, value] of Object.entries(this.corsSettings)) {
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
            this.routeTable[route][req.method.toLowerCase()]
          ) {
            // Get callback function from mapping object
            let callback = this.routeTable[route][req.method.toLowerCase()];

            // Get any middleware is applied
            let middlewares = this.routeTable[route][`${req.method.toLowerCase()}-middleware`];

            const matchRegex = req.url.match(new RegExp(parsedRoute));

            // Get request params from parsed URL
            req.params = matchRegex.groups;
            // Get query param from parsed URL
            req.query = parser.parseQuery(req.url);

            // Read body from request
            let body = await reader.readBody(req);

            // Parse body in JSON
            if (this.parseMethod === "json") {
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
      })
    })
  }

  #registerPath(path, cb, method, middleware) {
    if (!this.routeTable[path]) {
      this.routeTable[path] = {};
    }
    // Adding call back and middleware to route table
    this.routeTable[path] = {
      ...this.routeTable[path],
      [method]: cb, // Will save as "get": function() {}
      [method + "-middleware"]: [ // will save as "get-middleware": [function() {}, function() {}]
        ...this.defaultMiddleware, // Adding default middleware to all end points
        middleware
      ]
    };
  }

  // Add default middleware to default middleware array
  addDefaultMiddleware(callback) {
    if (callback) {
      this.defaultMiddleware = [
        ...this.defaultMiddleware,
        callback
      ]
    }
  }

  // Enable CORS settings by adding it to corsSettings Object
  useCORS(origin, headers, maxAge) {
    this.enableCORSSettings = true;
    // Add origin
    if (origin) {
      this.corsSettings = {
        ...this.corsSettings,
        'Access-Control-Allow-Origin': origin
      }
    }
    // Add headers if availble
    if (headers) {
      this.allowedMethods = headers.split(',')
      this.corsSettings = {
        ...this.corsSettings,
        'Access-Control-Allow-Methods': headers
      }
    } else { // otherwise add all other headers
      this.corsSettings = {
        ...this.corsSettings,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS, DELETE'
      }
    }
    if (maxAge) {
      this.corsSettings = {
        ...this.corsSettings,
        'Access-Control-Max-Age': maxAge
      }
    }
  }

  // Add custom headers to headers object
  addHeaders(key, value) {
    this.headers[key] = value;
  }

  useLogger() {
    this.addDefaultMiddleware(addons.logger);
  }

  get(path, ...rest) {
    if (rest.length === 1) {
      this.#registerPath(path, rest[0], "get");
    } else {
      this.#registerPath(path, rest[1], "get", rest[0]);
    }
  }

  post(path, ...rest) {
    if (rest.length === 1) {
      this.#registerPath(path, rest[0], "post");
    } else {
      this.#registerPath(path, rest[1], "post", rest[0]);
    }
  }

  put(path, ...rest) {
    if (rest.length === 1) {
      this.#registerPath(path, rest[0], "put");
    } else {
      this.#registerPath(path, rest[1], "put", rest[0]);
    }
  }

  delete(path, ...rest) {
    if (rest.length === 1) {
      this.#registerPath(path, rest[0], "delete");
    } else {
      this.#registerPath(path, rest[1], "delete", rest[0]);
    }
  }

  #bodyParse(method) {
    this.parseMethod = method
  }

  listen(port, callback) {
    this.server.listen(port, callback);
  }
}

module.exports = Host;