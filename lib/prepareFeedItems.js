const _ = require('lodash')

const feedItems = (rdtPost) => {
	let items = []
	rdtPost.data.children.forEach(child => {
		let item = {
			domain: child.data.domain,
			title: child.data.title,
			pubDate: new Date(child.data.created_utc * 1000),
			link: child.data.url,
			author: child.data.author,
			permalink: `https://reddit.com${child.data.permalink}`,
			items: rdtPost.data.children,
			nsfw: (!!child.data.over_18),
			secure_embed: child.data.secure_media_embed.content,
			oembed: (child.data.media && child.data.media.oembed) ? child.data.media.oembed.html : '',
			selftext: child.data.selftext_html,
			post_hint: child.data.post_hint
		}

		// SETUP THE CONTEEEENT

		// video oembed? Lets see if reddit works
		if (item.post_hint.indexOf(':video') !== -1) 
			item.content = _.unescape(item.secure_embed)
		
		// direct image embedding
		let exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']
		if (item.post_hint.indexOf('image') !== -1 
			|| exts.indexOf(item.link) !== -1) {
			item.content = `<img src="${item.link}" alt="">`
		}

		if (item.post_hint.indexOf('self') !== -1)
			item.content = item.selftext

		// if (item.post_hint.indexOf('link'))

		// hide NSFW content
		if (item.nsfw) item.content = ''

		items.push(item)
	})
	return items
}

module.exports = feedItems
