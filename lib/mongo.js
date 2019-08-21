const moment = require('moment')
const objectIdToTimestamp = require('objectid-to-timestamp')
const config = require('config-lite')(__dirname)
const Mongolass = require('mongolass')
const mongolass = new Mongolass()
mongolass.plugin('addCreatedAt', {
    afterFind: res => {
        res.forEach(item => {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm')
        })
        return res
    },
    afterFindOne: res => {
        if(res){
            res.created_at = moment(objectIdToTimestamp(res._id)).format('YYYY-MM-DD HH:mm')
        }
        return res
    }
})
mongolass.connect(config.mongodb)

exports.User = mongolass.model('User', {
    name: { type: 'string', required: true },
    password: { type: 'string', required: true },
    avatar: { type: 'string', required: true },
    gender: { type: 'string', enum: ['m', 'f', 'x'], default: 'x' },
    bio: { type: 'string', required: true },
})

exports.User.index({ name: 1 }, { unique: true }).exec()

exports.Post = mongolass.model('Post', {
    author: { type: Mongolass.Types.ObjectId, require: true },
    title: { type: 'string', require: true },
    content: { type: 'string', require: true },
    pv: { type: 'number', default: 0 },
})

// 按创建时间降序查看用户的文章列表
exports.Post.index({ author: 1, _id: -1}).exec()

exports.Comment = mongolass.model('Comment', {
    author: { type: Mongolass.Types.ObjectId, required: true },
    content: { type: 'string', require: true },
    postId: { type: Mongolass.Types.ObjectId, require: true}
})
