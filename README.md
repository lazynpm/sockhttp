
# SockHTTP

This package enables you to create simple secure REST API




## Features

- API Enabled with GET, POST, PUT and DELETE
- Add multiple middlewares
- Use common middlewares for app endpoints
- Set CORS Policy
- Inbuilt Authentication and Authorization
- Use any other package freely

## Upcoming Features
- Socket connections
- Gaurds
- Rate limiting
- CSRF Protection
- Inbuild Message bus


# Documentation

## Installation

Install sockhttp with npm

```bash
  npm install sockhttp
```

## Usage
Import httpsock

```js
const host = require('sockhttp');
```

Initialize application

```js
const app = host();
app.listen(3000, () => {
  console.log('Server running on 3000');
});
```

## Create endpoints

- GET

```js
app.get('',(req,res)=>{
    // do something
    res.send();
});
```

- PUT

```js
app.put('',(req,res)=>{
    // do something
    res.send();
});
```

- POST

```js
app.post('',(req,res)=>{
    // do something
    res.send();
});
```

- DELETE

```js
app.delete('',(req,res)=>{
    // do something
    res.send();
});
```

## Middlewares

You can create a sequence of middlewares using

```bash
function defaultMiddleware(req,res,next) {
  console.log(1);
  next();
}
app.addDefaultMiddleware(defaultMiddleware);
```

You can add multiple middleware using it and they will be executed in the sequence in which they have been added

```bash
app.addDefaultMiddleware(defaultMiddleware1);
app.addDefaultMiddleware(defaultMiddleware2);
app.addDefaultMiddleware(defaultMiddleware3);
```

If you want to add a middleware specific to a endpoint, use this syntax

```bash
function someMiddleware(req, res, next) {
    next();
}
app.get('',someMiddleware, (req, res) => {
    // do something
    res.send();
});
```

## CORS
To enable CORS Policy, use 

```bash
app.useCORS('*','GET',60);
```

- First param takes allowed origin string separated by "," (comma)
- Second param takes allowed methods in Capital case, separated by "," (comma)
- Third param takes allowed max age in seconds

when using CORS, first param is mandatory.

## Logger
To use logger, use 

```js
app.useLogger();
```

## Query Params
To use, query Params, use
```js
app.get('/products', (req, res) => {
  console.log('query params', req.query)
  res.send('text');
})
```

## Request params
To use request params, use

```js
app.get("/products/:id", (req, res) => {
  console.log('req.params', req.params);
  res.send("product id");
});
```

## Body
To use body in methods, use
```js
app.post('/products', (req,res) => {
  const body = req.body;
  ...
},)
```

## Headers
To add custom headers,
```js
app.addHeader('key','value')
```
    
## Support

For support, connect with me on Linkedin (https://www.linkedin.com/in/lazycoderr) or twitter (https://twitter.com/lazycoderr).


## Authors

- [@Arpit Sharma](https://github.com/OrignalLazyCoder)

