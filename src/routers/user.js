const express = require('express')
const router = express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendGoodByeEmail } = require('../emails/account')

router.get('/test', (req, res) => {
    res.send('From a new file yoohoo')
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        /*
        // this call below is asynchronous , but we do not need to 
        //   use await with it becuase we can let the call to 
        //   send email run in background asynchronously. 
        //   It's not needed for the est fo the functionality
        */
        sendWelcomeEmail(user.email, user.name) 
        
        const token = await user.generateAuthToken()

        res.status(201).send({user, token})
    } catch (e) {
        res.status(404).send(e) 
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({user, token})
    } catch (e) {

        res.status(500).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((tokenObj) => {
            tokenObj.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send({error: e.mess})
    }
})

router.get('/users/me', auth , async (req, res) => {
     res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) =>  allowedUpdates.includes(update) )

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'});
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        await req.user.save()

        res.status(200).send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        
        /*
        // this call below is asynchronous , but we do not need to 
        //   use await with it becuase we can let the call to 
        //   send email run in background asynchronously. 
        //   It's not needed for the rest fo the functionality
        */
        sendGoodByeEmail(req.user.email, req.user.name)

        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const uplAvatar = multer({
    // dest: 'avatars', // this indicates where to store the file // if not declared the file data will be passed one by the multer
    limits: {
        fileSize: 1 * 1024 * 1024
    },
    fileFilter (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload jpg, jpeg or png files only'))
        }

        cb(undefined, true)
    }
})
router.post('/users/me/avatar', auth, uplAvatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
                      width: 250,
                      height: 250
                  }).png().toBuffer()

    
    req.user.avatar = buffer
    await req.user.save()
    res.status(200).send({messge: 'Avatar uploaded'})
}, (err, req, res, next) => {
    res.status(400).send({error: err.message})
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        if (!req.user.avatar) {
            throw new Error('User does not have an avatar already')
        }

        req.user.avatar = undefined
        await req.user.save()
        res.status(200).send({message: 'Avatar deleted'})
    } catch (e) {
        res.status(400).send({error: e.message})
    }
})

router.get('/users/:id/avatar' , auth, async (req, res) => {
    try {
        const userOfAvatar = await User.findById(req.params.id)

        if (!userOfAvatar) {
            throw new Error('User not found for given id.. So no avatar for you!')
        }
        if (!userOfAvatar.avatar) {
            throw new Error('This user does not have an Avatar')
        }

        res.set('Content-Type', 'image/png').status(200).send(userOfAvatar.avatar)
    } catch (e) {
        res.status(400).send({error: e.message})
    }
})

module.exports = router