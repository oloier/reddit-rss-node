const oembed = require('oembed')
const _ = require('lodash')
oembed.EMBEDLY_KEY = process.env.EMBEDLY_API_KEY

class RssItem {

	constructor(item) {
		this.item = item.data
		// this.item.oembed = this.getOEmbed()
		this.content = this.topContent
	}

	get getOEmbed() {
		oembed.fetch(this.item.url, { maxwidth: 940 }, function(error, result) {
			// res.type('text/html')
			// res.send(result.html)
			return result.html
		})
		return ''
	}

	get embedContent() {
		var thing = (
			(this.item.secure_media && this.item.secure_media.oembed.html) 
			|| `&lt;img src=&quot;${this.item.url}&quot;&gt;` 
			|| '')
		return thing
	}

	get topContent() {
		
		return _.escape(`<div><a href="https://www.reddit.com${this.item.permalink}">View Reddit Comments / SelfPost</a></div>
		<p><small><b>${this.item.domain}</b>&ndash; posted by <em>${this.item.author}</em></small></p>`)
	}
	
}

module.exports = RssItem
