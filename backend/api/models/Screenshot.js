var mongoose = require('mongoose')

// define the schema for our user model
var Schema = mongoose.Schema({
    auraID : { type: String, index: true},
    localFile : String,
    sort: {type: Number, default: 999},
    s3Key: String,
    uploaded : { type: Date, default: Date.now },
    file: {
      original: {
        png: String,
        webp: String,
        gif: String
      },
      thumbnail: {
        png: String,
        webp: String,
        gif: String
      }
    }
}, {timestamps: true})

// build URL to original image
Schema.virtual('url').get(function() {
  if (this.localFile)
    return "https://media.wago.io/screenshots/"+this.auraID+'/'+encodeURIComponent(this.localFile)
  else
    return "https://"+this.s3Server+"/"+this.original_bucket+"/"+encodeURIComponent(this.s3Key)
})

Schema.statics.findForWago = function(id, one) {
  if (one) {
    return this.findOne({auraID: id, localFile: {$exists: true}}).sort({sort:1}).exec()
  }
  else {
    return this.find({auraID: id, localFile: {$exists: true}}).sort({sort:1}).exec()
  }
}

async function setMeiliIndex() {
  const wago = await WagoItem.lookup(this.auraID)
  if (wago && !(wago.hidden || wago.private || wago.encrypted || wago.restricted || wago.deleted || wago.blocked)) {
    var meiliToDoWA = await redis.getJSON('meili:todo:weakauras') || []
    meiliToDoWA = meiliToDoWA.filter(doc => {
      return doc.id !== this._id
    })
    meiliToDoWA.push(await wago.meiliWAData)
    redis.setJSON('meili:todo:weakauras', meiliToDoWA)
    if (!wago._meiliWA) {
      wago._meiliWA = true
      await wago.save()
    }
  }
}

Schema.post('save', setMeiliIndex)
Schema.post('update', setMeiliIndex)
Schema.post('remove', setMeiliIndex)

const Screenshot = mongoose.model('AuraScreenshot', Schema)
module.exports = Screenshot