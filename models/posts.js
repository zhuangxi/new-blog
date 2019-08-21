const marked = require('marked')
const Post = require('../lib/mongo').Post
const CommentModel = require('./comments')

// 给 post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
    afterFind: function (posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount
                return post
            })
        }))
    },
    afterFindOne: function (post) {
        if (post) {
            return CommentModel.getCommentsCount(post._id).then(function (count) {
                post.commentsCount = count
                return post
            })
        }
        return post
    }
})

Post.plugin('contentToHtml', {
    afterFind: (posts) => {
        return posts.map((post) => {
            post.content = marked(post.content)
            return post
        })
    },
    afterFindOne: (post) => {
        if (post) {
            post.content = marked(post.content)
        }
        return post
    }
})

module.exports = {
    // 创建一篇文章
    create: (post) => {
        return Post.create(post).exec()
    },
    getPostById: (postId) => {
        return Post.findOne({
            _id: postId
        }).populate({
            path: 'author',
            model: 'User'
        }).addCreatedAt().addCommentsCount().contentToHtml().exec()
    },
    // 按创建时间降序获取所有用户文章或者某个特定用户的所有文章
    getPosts: (author) => {
        const query = {}
        if (author) {
            query.author = author
        }
        return Post.find(query).populate({
            path: 'author',
            model: 'User'
        }).sort({
            _id: -1
        }).addCreatedAt().addCommentsCount().contentToHtml().exec()
    },
    // 通过文章id给pv加1
    incPv: (postId) => {
        return Post.update({
            _id: postId
        }, {
            $inc: {
                pv: 1
            }
        }).exec()
    },
    // 获取原生文章
    getRawPostById: (postId) => {
        return Post.findOne({
            _id: postId
        }).populate({
            path: 'author',
            model: 'User'
        }).exec()
    },
    // 更新文章
    updatePostById: (postId, data) => {
        return Post.update({
            _id: postId
        }, {
            $set: data
        }).exec()
    },
    // 删除文章
    deletePostById: (postId) => {
        return Post.deleteOne({
            _id: postId
        }).exec().then(res => {
            if(res.result.ok && res.result.n > 0){
                return CommentModel.delCommentsByPostId(postId)
            }
        })
    }
}
