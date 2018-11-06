const oembed = require('oembed')
const unfurl = require('unfurl.js')
const imgUrl = require('is-image-url')
const _ = require('lodash')
oembed.EMBEDLY_KEY = process.env.EMBEDLY_API_KEY

class RssItem {

	constructor(item) {
		this.item = item.data
	}

	init() {
		try {
			this.embed = this.getEmbed()
			if (this.embed !== null)
				this.content = _.unescape(this.topContent + this.embed)
			console.log(`new RssItem created: ${this.embed}`)
		} catch (ex) {
			throw ex
		}
	}

	async getEmbeddy() {
		try {
			return await unfurl(this.item.url)
		} catch (ex) {
			throw ex
		}
	}
	
	async init2() {
		try {
			let embedContent = null
			const embed = await this.getEmbeddy()
			// console.log(embed)
			if (embed && embed.oembed) {
				embedContent = embed.oembed.html
				// console.log('new RssItem created:')
				// console.log(embed)
			} else if(imgUrl(this.item.url)) {
				embedContent = `<img src=${this.item.url} alt="">`
			}
			this.content = _.unescape(embedContent)
		} catch (ex) {
			throw ex
		}
	}

	getEmbed() {
		oembed.fetch(this.item.url, {}, (err, result) => {
			if (err) return null
			return result.html
		})
	}
	
}

module.exports = RssItem
