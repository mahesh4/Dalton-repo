function authenticateUser(req, res, next) {
    if(req.session && req.session.userId) {
        return next();
    }
    //return res.redirect('/login');
}

function authenticateAdmin(req, res, next) {
    if(req.session && req.session.userId && req.session.rank === "admin") {
        return next();
    }
    //return res.redirect('/login');
}

module.exports = {
    user: authenticateUser,
    admin: authenticateAdmin
};