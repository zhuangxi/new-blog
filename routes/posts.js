const express = require('express')
const router = express.Router()

const PostModel = require('../models/posts')
const UserModel = require('../models/users')
const checkLogin = require('../middlewares/check').checkLogin

router.get('/', (req, res, next) => {
    const author = req.query.author
    PostModel.getPosts(author).then((posts) => {
        res.render('posts', {  posts: posts })
    }).catch(next)
})

router.get('/create', checkLogin, (req, res, next) => {
    const name = req.session.user.name
    UserModel.getUserByName(name).then((user) => {
        res.render('create', { user: user })
    })
})

router.post('/create', checkLogin, (req, res, next) => {
    const author = req.session.user._id
    const title = req.fields.title
    const content = req.fields.content

    // 校验参数
    try {
        if (!title.length) {
            throw new Error('请填写标题')
        }
        if (!content.length) {
            throw new Error('请填写内容')
        }
    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('back')
    }
    let post = {
        author: author,
        title: title,
        content: content
    }

    PostModel.create(post).then(function(result){
        post = result.ops[0]
        req.flash('success', '发表成功')
        console.log(`/posts/${post._id}`)
        res.redirect(`/posts/${post._id}`)
    }).catch(next)
})

router.get('/:postId', (req, res, next) => {
    res.send('文章详情页')
})

router.get('/:postId/edit', checkLogin, (req, res, next) => {
    res.send('更新文章页')
})

router.post('/:postId/edit', checkLogin, (req, res, next) => {
    res.send('更新文章')
})

router.post('/:postId/remove', checkLogin, (res, req, next) => {
    res.send('删除文章')
})

module.exports = router
