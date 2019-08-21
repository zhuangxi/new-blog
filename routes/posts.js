const express = require('express')
const router = express.Router()

const PostModel = require('../models/posts')
const UserModel = require('../models/users')
const CommentModel = require('../models/comments')
const checkLogin = require('../middlewares/check').checkLogin

router.get('/', (req, res, next) => {
    const author = req.query.author
    PostModel.getPosts(author).then((posts) => {
        res.render('posts', {
            posts: posts
        })
    }).catch(next)
})

router.get('/create', checkLogin, (req, res, next) => {
    const name = req.session.user.name
    UserModel.getUserByName(name).then((user) => {
        res.render('create', {
            user: user
        })
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

    PostModel.create(post).then(function (result) {
        post = result.ops[0]
        req.flash('success', '发表成功')
        res.redirect(`/posts/${post._id}`)
    }).catch(next)
})

router.get('/:postId', (req, res, next) => {
    const postId = req.params.postId
    Promise.all([
        PostModel.getPostById(postId),
        CommentModel.getComments(postId),
        PostModel.incPv(postId)
    ]).then(result => {
        const post = result[0]
        const comments = result[1]
        if (!post) {
            throw new Error('该文章不存在')
        }
        res.render('post', {
            post: post,
            comments: comments
        })
    }).catch(next)
})

router.get('/:postId/edit', checkLogin, (req, res, next) => {
    const postId = req.params.postId
    const author = req.session.user._id
    PostModel.getRawPostById(postId).then(post => {
        if (!post) {
            throw new Error('该文章不存在')
        }
        if (author.toString() !== post.author._id.toString()) {
            throw new Error('权限不足')
        }
        res.render('edit', {
            post: post
        })
    }).catch(next)
})

router.post('/:postId/edit', checkLogin, (req, res, next) => {
    const postId = req.params.postId
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
    PostModel.getRawPostById(postId).then(post => {
        if (!post) {
            throw new Error('该文章不存在')
        }
        if (author.toString() !== post.author._id.toString()) {
            throw new Error('权限不足')
        }
        PostModel.updatePostById(postId, {
            title: title,
            content: content
        }).then(() => {
            req.flash('success', '编辑文章成功')
            res.redirect(`/posts/${postId}`)
        }).catch(next)
    })
})

router.get('/:postId/remove', checkLogin, (req, res, next) => {
    const postId = req.params.postId
    const author = req.session.user._id
    PostModel.getRawPostById(postId).then(post => {
        if (!post) {
            throw new Error('文章不存在')
        }
        if (post.author._id.toString() !== author.toString()) {
            throw new Error('没有权限')
        }
        PostModel.deletePostById(postId).then(() => {
            req.flash('success', '删除成功')
            res.redirect(`/posts`)
        })
    })
})

module.exports = router
