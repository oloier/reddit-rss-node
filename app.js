require('dotenv').config()
const fs = require('fs')
const fastify = require('fastify')({logger: false})
const _ = require('lodash')
const fetch = require('node-fetch')

fastify.get('/', (request, resp) => {
	resp.redirect('/r/all/top-day/limit-10')
})

fastify.get('/v/:url', (request, resp) => {
	const url = decodeURIComponent(request.params.url) || ''

	resp.header('content-type', 'text/html; charset=utf-8')
	resp.header('cache-control', 'no-cache')
	resp.header('x-xss-protection', '1')
	resp.header('x-content-type-options', 'nosniff')
	resp.header('strict-transport-security', 'max-age=31536000')
	// invoke lodash template string, send as response
	resp.send(render('video-iframe.html', {url}))
})

fastify.get('/:subreddit/top-:time/limit-:limit', async (request, resp) => {
	try {
		const subreddit = request.params.subreddit || 'all'
		const time = request.params.time || 'day'
		const limit = request.params.limit || 5
		
		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`
		// console.info(`URL request: ${feed}`)

		const json = await fetchGet(feed)
		const rssObjects = prepareFeedItems(json)
		const rssMomma = {
			subreddit: subreddit,
			canonical: `https://reddit.com/r/${subreddit}`,
			items: rssObjects
		}

		// invoke lodash template string, send as responsenpm s
		resp.header('content-type', 'application/rss+xml')
		resp.send(render('rss.xml', rssMomma))
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
	rdtPost.data.children.forEach(rdt => {
		let item = {
			domain: rdt.data.domain,
			title: rdt.data.title,
			pubDate: new Date(rdt.created_utc * 1000),
			url: rdt.data.url,
			author: rdt.data.author,
			permalink: `https://reddit.com${rdt.permalink || ''}`,
			items: rdtPost.data.children || [],
			nsfw: (!!rdt.over_18),
			secure_embed: rdt.data.secure_media_embed || '',
			selftext: rdt.data.selftext_html || '',
			post_hint: rdt.data.post_hint,
			num_comments: rdt.num_comments,
			thumbnail: {
				url: rdt.data.thumbnail,
				width: rdt.data.thumbnail_width,
				height: rdt.data.thumbnail_height
			}
		}

		// const videoTemplate = _.template('<iframe width=100% height=100% frameborder=0 src="data:text/html,<video src=\'<%= url %>\' controls muted autoplay loop playsinline>"></video></iframe>')
		// const videoTemplate = _.template('<video src="<%= url %>" width=800 height=600 controls muted autoplay loop playsinline></video>')
		const videoTemplate = (url, width=640, height=420) => {
			return `<iframe width=${width} height=${height} frameborder=0 src="https://oloier.com/r/v/${encodeURIComponent(url)}"></iframe>`
		}

		// rich:video is anything with oembed
		if (item.post_hint == 'rich:video')
			item.content = _.unescape(item.secure_embed.content)

		// hosted:video is any reddit-hosted video
		if (item.post_hint == 'hosted:video') {
			let rv = rdt.data.secure_media.reddit_video
			item.content = videoTemplate(rv.fallback_url, rv.width, rv.height)
		}

		// direct image embedding
		let exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']
		if (item.post_hint && item.post_hint.indexOf('image') !== -1 ||
			exts.indexOf(item.url) !== -1) {
			item.content = `<img src="${item.url}" alt="">`
		}

		// do your best, self text... who goddamn cares.
		if (item.post_hint && item.post_hint.indexOf('self') !== -1)
			item.content = _.unescape(item.selftext)

		// individual other site exceptions, imgur, instagram, etc.
		if (item.post_hint && item.post_hint.indexOf('link') !== -1) {
			if (item.domain.indexOf('imgur.com') !== -1 && item.url.indexOf('.gifv' !== -1)) {
				// replace gifv with <video> embed of mp4 source URL
				//	 item.content = videoTemplate(item.url.replace('.gifv', '.mp4'))
				let rvp = rdt.data.preview.reddit_video_preview
				item.content = videoTemplate(rvp.fallback_url, rvp.width, rvp.height)
			}
		}

		// hide NSFW content, or any content for a straight link
		if (item.nsfw) item.content = ''


		items.push(item)
	})
	return items
}

// lodash template compilation
function render(view, ctx = {}) {
	return _.template(fs.readFileSync(`./views/${view}`))(ctx)
}

fastify.listen(process.env.PORT, (err, address) => {
	if (err) throw err
	console.info(`server listening on ${address}`)
	fastify.log.info(`server listening on ${address}`)
})
