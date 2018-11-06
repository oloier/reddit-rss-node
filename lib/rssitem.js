const oembed = require('oembed')
const _ = require('lodash')
oembed.EMBEDLY_KEY = process.env.EMBEDLY_API_KEY

class RssItem {

	constructor(item) {
		this.item = item.data
	}

	async init() {
		try {
			this.embed = this.getEmbed()
			if (this.embed !== null)
				this.content = _.unescape(this.topContent + this.embed)
			console.log(`new RssItem created: ${this.embed}`)
		} catch (ex) {
			throw ex
		}
	}

	getEmbed() {
		// let txt 
		oembed.fetch(this.item.url, {}, (err, result) => {
			if (err) return null
			return result.html
		})
		// console.log(txt)
		// return txt 
	}

	get topContent() {
		return `<div><a href="https://www.reddit.com${this.item.permalink}">View Reddit Comments / SelfPost</a></div>
		<p><small><b>${this.item.domain}</b>&ndash; posted by <em>${this.item.author}</em></small></p>`
	}
	
}

module.exports = RssItem
