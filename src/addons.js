function logger(req, res, next) {
    console.log(`REQUESTING: ${req.url}`);
    next();
}

module.exports = {
    logger
}