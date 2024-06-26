import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import User from "../models/User.js"
import { createError } from "../error.js"
import jwt from "jsonwebtoken"
import { json } from "express"


export const signup = async (req,res,next) => {
    try{
        const salt = await bcrypt.genSalt(10)
        console.log(salt)
        const hash = bcrypt.hashSync(req.body.password,salt)
        console.log(hash)
        const newUser = new User({...req.body, password: hash})
        console.log(newUser);
        await newUser.save()
        res.status(201).send("User has been Created!")
    }catch(err){
        //todo
        console.log(err.message)
        next(err)
    }
}

export const signin = async (req,res,next) => {
    try{
        const user = await User.findOne({name: req.body.name})
        if(!user) return next(createError(404,"User not found!"))

        const isCorrect = await bcrypt.compare(req.body.password,user.password)
        if(!isCorrect) return next(createError(400,"Wrong Credentials"))
        const token = jwt.sign({id: user._id},process.env.JWT)
        console.log(token)
        const {password, ...others} = user._doc;
        others['access_token'] = token;
        res.cookie('access_token',token,{
            httpOnly: true,      
            domain: 'localhost',
            path: '/',
            secure: false, // Set to true if using HTTPS
            sameSite: 'None' ,
            expires: new Date(Date.now() + 259200000),
        }).status(200).json(others);
    }catch(err){
        //todo
        console.log(err.message)
        next(err)
    }
}

export const googleSignIn = async (req,res,next) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if(user){
            const token = jwt.sign({id: user._id},process.env.JWT)
            res.cookie("access_token",token,{
                httpOnly: true
            }).status(200).json(user._doc) 
        }else{
            const newUser = new User({...req.body,fromGoogle: true})
            const savedUser = await newUser.save();
            const token = jwt.sign({id: savedUser._id},process.env.JWT)
            res.cookie("access_token",token,{
                httpOnly: true
            }).status(200).json(savedUser._doc) 
        }
    } catch (err) {
        next(err)
    }
}