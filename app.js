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
	rdtPost.data.children.forEach(child => {
		let item = {
			domain: child.data.domain,
			title: child.data.title,
			pubDate: new Date(child.data.created_utc * 1000),
			url: child.data.url,
			author: child.data.author,
			permalink: `https://reddit.com${child.data.permalink}`,
			items: rdtPost.data.children,
			nsfw: (!!child.data.over_18),
			secure_embed: child.data.secure_media_embed.content,
			selftext: child.data.selftext_html,
			post_hint: child.data.post_hint,
			num_comments: child.data.num_comments,
			thumbnail: {
				url: child.data.thumbnail,
				width: child.data.thumbnail_width,
				height: child.data.thumbnail_height
			},
			is_reddit_video: child.data.is_reddit_media_domain,
			reddit_video_url: (child.data.media && child.data.media.reddit_video) 
				? child.data.media.reddit_video.fallback_url : null
				// ? {
				// 	url: child.data.media.reddit_video.fallback_url.child,
				// 	width: ,
				// 	height: 
				// } : null
		}
		
		// oembed: (child.data.media && child.data.media.oembed) ? child.data.media.oembed.html : '',

		// video oembed? yes please. thx reddit.
		// const videoTemplate = _.template('<iframe width=100% height=100% frameborder=0 src="data:text/html,<video src=\'<%= url %>\' controls muted autoplay loop playsinline>"></video></iframe>')
		// const videoTemplate = _.template('<video src="<%= url %>" width=800 height=600 controls muted autoplay loop playsinline></video>')
		const videoTemplate = (url) => {
			return '<iframe width=650 height=420 frameborder=0 '
			+ `src="https://oloier.com/r/v/${encodeURIComponent(url)}"></iframe>`
		}

		if (item.post_hint && item.post_hint.indexOf(':video') !== -1) {
			if (item.is_reddit_video && item.reddit_video_url)
				item.content = videoTemplate(item.reddit_video_url)
			else item.content = _.unescape(item.secure_embed)
		}

		// direct image embedding
		let exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']
		if (item.post_hint && item.post_hint.indexOf('image') !== -1 ||
			exts.indexOf(item.url) !== -1) {
			item.content = `<img src="${item.url}" alt="">`
		}

		// do your best, self text... who goddamn cares.
		if (item.post_hint && item.post_hint.indexOf('self') !== -1)
			item.content = item.selftext

		// hide NSFW content, or any content for a straight link
		if (item.nsfw) item.content = ''

		// individual other site exceptions, imgur, instagram, etc.
		if (item.post_hint && item.post_hint.indexOf('link') !== -1) {
			// replace gifv with <video> embed of mp4 source URL
			if (item.domain.indexOf('imgur.com') !== -1 && item.url.indexOf('.gifv' !== -1))
				item.content = videoTemplate(item.url.replace('.gifv', '.mp4'))
		}
		
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
