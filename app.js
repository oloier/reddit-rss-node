require('dotenv').config()
const fs = require('fs')
const express = require('express')
const app = express()
const _ = require('lodash')
const fetch = require('node-fetch')

app.get('/r/:subreddit/top-:time/limit-:limit', async (req, res) => {
	try {
		const subreddit = req.params.subreddit
		const time = req.params.time
		const limit = req.params.limit

		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`

		const json = await fetchGet(feed)
		const rssObjects = prepareFeedItems(json)
		const rssMomma = {
			subreddit: subreddit,
			canonical: `https://reddit.com/r/${subreddit}`,
			items: rssObjects
		}

		// invoke lodash template string, send as response
		res.set('Content-Type', 'application/rss+xml')
		res.send(render('rss', rssMomma))
	} catch (ex) {
		console.error(ex)
	}
})

const fetchGet = async (url) => {
	try {
		const response = await fetch(url)
		if (response.ok) return await response.json()
		throw new Error(`${response.status} ${response.statusText}`)
	} catch (ex) {
		console.log(`${ex}, ${ex.stack}`)
	}
}

const prepareFeedItems = (rdtPost) => {
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

		// video oembed? yes please. thx reddit.
		if (item.post_hint.indexOf(':video') !== -1) 
			item.content = _.unescape(item.secure_embed)
		
		// direct image embedding
		let exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']
		if (item.post_hint.indexOf('image') !== -1 
			|| exts.indexOf(item.link) !== -1) {
			item.content = `<img src="${item.link}" alt="">`
		}

		// do your best, self text... who goddamn cares.
		if (item.post_hint.indexOf('self') !== -1)
			item.content = item.selftext

		// hide NSFW content, or any content for a straight link
		if (item.nsfw || item.post_hint.indexOf('link')) item.content = ''

		items.push(item)
	})
	return items
}

// lodash template compilation
function render(view, ctx = {}) {
	return _.template(fs.readFileSync(`./views/${view}.html`))(ctx)
}

// module.exports = app
app.listen(process.env.PORT)
