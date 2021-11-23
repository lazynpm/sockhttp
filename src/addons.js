// Simple logger to log requested URL
// TODO: Make it more practical to use
function logger(req, res, next) {
    console.log(`REQUESTING: ${req.url}`);
    next();
}

module.exports = {
    logger
}