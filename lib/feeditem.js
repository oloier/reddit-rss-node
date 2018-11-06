// const unfurl = require('unfurl.js')
// const imgUrl = require('is-image-url')
const _ = require('lodash')

// const getEmbed = async (url) => {
// 	try {
// 		return await unfurl(url)
// 	} catch (ex) {
// 		throw ex
// 	}
// }


const buildObjects = (redditObj) => {
	let items = []
	redditObj.data.children.forEach(child => {
		let item = {
			domain: child.data.domain,
			title: child.data.title,
			pubDate: new Date(child.data.created_utc * 1000),
			link: child.data.url,
			author: child.data.author,
			permalink: `https://reddit.com${child.data.permalink}`,
			items: redditObj.data.children,
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
			|| exts.indexOf(item.url) !== -1) {
			item.content = `<img src="${item.url}" alt="">`
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

// const buildObject = (redditObj) => {
// 	return {
// 		subreddit: redditObj.data.children.data.subreddit,
// 		canonical: 'https://reddit.com/r/'+redditObj.data.children.data.subreddit,
// 		domain: redditObj.data.children.data.domain,
// 		title: redditObj.data.children.data.title,
// 		pubDate: new Date(redditObj.data.children.data.created_utc * 1000),
// 		link: redditObj.data.children.data.url,
// 		author: redditObj.data.children.data.author,
// 		permalink: `https://reddit.com${redditObj.data.children.data.permalink}`,
// 		items: redditObj.data.children,
// 		nsfw: (!!redditObj.data.children.data.over_18),
// 		secure_embed: redditObj.data.children.data.secure_media_embed.content,
// 		oembed: redditObj.data.children.data.media.oembed.html,
// 		selftext: redditObj.data.children.data.selftext_html,
// 		post_hint: redditObj.data.children.data.post_hint
// 	}
// }

const fillValues = (rdt) => {
	// video oembed? Lets see if reddit works
	if (rdt.post_hint.indexOf(':video') !== -1)
		rdt.content = rdt.oembed

	// direct image embedding
	let exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']
	if (rdt.post_hint.indexOf('image') !== -1 
		|| exts.indexOf(rdt.url) !== -1) {
		rdt.content = `<img src="${rdt.url}" alt="">`
	}

	if (rdt.post_hint.indexOf('self'))
		rdt.content = rdt.selftext
	// if (rdt.post_hint.indexOf('link'))
	
	// hide NSFW content
	if (rdt.nsfw) rdt.content = ''

	return rdt
}

module.exports.buildObjects = buildObjects
module.exports.fillValues = fillValues
