const config = require("../config/auth.config")
const db = require("../models")
const User = db.user
var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")
const { user } = require("../models")
const Role = db.role

exports.signup =(req, res)=>{
    
    const user = new User({
        username: req.body.username,
        shopName:req.body.shopName,
        email: req.body.email,
        image:req.body.image,
        phone:req.body.phone,
        address:req.body.address,
        password: bcrypt.hashSync(req.body.password, 8), 
        image: req.body.image

    }); 
    
    user.save((err, user)=> {
        if(err){
            res.status(500).send({message:err})

            return
        }
        
        if(req.body.roles){
            Role.find(
                {
                name: { $in: req.body.roles }
                },
                
                (err, roles) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    user.roles = roles.map(role => role._id);
                    
                    user.save(err =>{
                        if(err){
                            res.status(500).send({message:err})

                            return
                        }

                        res.send({ message: "User was registered successfully!" });

                    })
                }
            )
        }else{
            Role.findOne({ name: "user" }, (err, role) =>{
                if(err){
                    res.status(500).send({message:err})

                    return
                }
                user.roles = [role._id];
                
                user.save(err=>{

                    if(err){
                        res.status(500).send({ message: err });

                        return
                    }

                    res.send({ message: "User was registered successfully!" });

                })

            })
        }

    })
};



exports.signin = (req, res) =>{
    User.findOne({
        username: req.body.username
    }).populate("roles","-__v" )

    .exec((err, user) => {

        if(err){
            res.status(500).send({message:err})

            return
        }
        if(!user){

            return res.status(404).send({message:"User Not found"})

        }
        var passwordlsVaild = bcrypt.compareSync(
            req.body.password,
            user.password
        )
        if(!passwordlsVaild){
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            })
        }

        var token= jwt.sign({
            id:user.id
        }, config.secret,{
            expiresIn: 86400 // 24 hours

        })

        var authorities = []
        for (let i = 0; i < user.roles.length; i++){
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
        res.status(200).send({
            id: user._id, 
            username: user.username, 
            email: user.email,
            roles: user.roles,
            image: user.image,
            phone: user.phone,
            address:user.address,
            roles: authorities,
            accessToken:token

        })
    })
}
