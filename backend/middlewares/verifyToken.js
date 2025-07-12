import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).send({ msg: "Unauthorized access!" });
        }       
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).send({ msg: "Unauthorized access!" });
        
    }
}

export default verifyToken;