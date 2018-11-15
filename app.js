require('dotenv').config() // for host:PORT
const fs = require('fs')
const fastify = require('fastify')({logger: false})
const _ = require('lodash')
const fetch = require('node-fetch')

// redirect root to default feed
fastify.get('/', (request, resp) => {resp.redirect('/r/all/top-day/limit-10')})

// setup our video embed iframe route
fastify.get('/v/:url', (request, resp) => {
	const url = decodeURIComponent(request.params.url) || ''

	resp.header('content-type', 'text/html; charset=utf-8')
	resp.header('cache-control', 'no-cache')
	resp.header('x-xss-protection', '1')
	resp.header('x-content-type-options', 'nosniff')
	resp.header('strict-transport-security', 'max-age=31536000')
	// build template via lodash
	resp.send(render('video-iframe.html', {url}))
})

// [host]/subreddit/top-[day,month,year,all]/limit-[itemCount]
fastify.get('/:subreddit/top-:time/limit-:limit', async (request, resp) => {
	try {
		// include default values
		const subreddit = request.params.subreddit || 'all'
		const time = request.params.time || 'day'
		const limit = request.params.limit || 5

		// static json feed URL; may it never change 🤞 
		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`

		// fetch our feed, build into object
		const json = await fetchGet(feed)
		const rssObjects = prepareFeedItems(json)
		const rssMomma = {
			subreddit: subreddit,
			canonical: `https://reddit.com/r/${subreddit}`,
			items: rssObjects
		}

		// build template via lodash
		resp.header('content-type', 'application/rss+xml; charset=utf-8')
		resp.send(render('rss.xml', rssMomma))
	} catch (ex) {
		console.error(ex)
	}
})

// utilize node-fetch for retrieving reddit's json feed
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
	
	// small self-contained iframe video embedding
	const videoTemplate = (url, width = 640, height = 420) => {
		if (height > 900) height = 900
		return `<iframe width=${width} height=${height} frameborder=0 src="https://oloier.com/r/v/${encodeURIComponent(url)}"></iframe>`
	}
	
	// embeddable image extensions
	const exts = ['.jpg', '.png', '.webp', '.gif', '.jpeg']

	// crimp the reddit JSON object to a simpler format
	let items = []
	rdtPost.data.children.forEach(rdt => {
		let item = {
			domain: rdt.data.domain,
			title: rdt.data.title,
			pubDate: new Date(rdt.data.created_utc * 1000),
			url: rdt.data.url,
			author: rdt.data.author,
			permalink: `https://reddit.com${rdt.data.permalink || ''}`,
			nsfw: (!!rdt.data.over_18),
			secure_embed: rdt.data.secure_media_embed || '',
			selftext: rdt.data.selftext_html || '',
			post_hint: rdt.data.post_hint || 'self', 
			num_comments: rdt.data.num_comments,
			thumbnail: {
				url: rdt.data.thumbnail,
				width: rdt.data.thumbnail_width,
				height: rdt.data.thumbnail_height
			}
		}
		
		//
		// content customization, specific for web-based RSS readers (inoreader)
		//

		// remove thumbnails for appropriate post_hints
		if (item.post_hint.containsAny(['self', 'image', 'link'])
			|| item.thumbnail.url == 'default')
			item.thumbnail = null

		// rich:video is anything with oembed
		if (item.post_hint == 'rich:video')
			item.content = _.unescape(item.secure_embed.content)

		// hosted:video is any reddit-hosted video
		if (item.post_hint == 'hosted:video') {
			let rv = rdt.data.secure_media.reddit_video
			item.content = videoTemplate(rv.fallback_url, rv.width, rv.height)
		}

		// reddit.self stuff; encoded HTML. Strip out 
		if (item.post_hint == 'self') {
			item.selftext = _.unescape(item.selftext)
			// comments sometimes end up rendering in feed clients; remove 'em.
			item.content = item.selftext.replace(/<!--(.*?)-->/, '')
		}
		
		// direct image embedding
		if (item.post_hint && item.post_hint.indexOf('image') !== -1 ||
			item.url.containsAny(exts)) {
			item.content = `<img src="${item.url}" alt=""/>`
		}

		// individual other site exceptions, imgur, instagram, etc.
		if (item.post_hint && item.post_hint.indexOf('link') !== -1) {

			// old way: item.url.replace('gifv', 'mp4')
			if (item.domain.indexOf('imgur.com') !== -1) {
				
				// follow reddit's 'preview' (mirror) of gifv videos, because
				// they're just terrible
				if (item.url.indexOf('.gifv') !== -1) {
					let rvp = rdt.data.preview.reddit_video_preview
					item.content = videoTemplate(rvp.fallback_url, rvp.width, rvp.height)
				}

				// force extension to url on imgur page links; galleries are
				// unsupported, but they're so rare.
				if (!item.url.containsAny(exts)) 
					item.content = `<img src="${item.url + exts[0]}" alt="">`

			}
		}
		// hide and label NSFW content
		if (item.nsfw) 
			item.content = '<p><small>NSFW, preview removed</small></p>'

		//
		// end content customizations
		//
		
		items.push(item)
	})
	return items
}

// if string contains array substr : string.containsAny(['str1', 'str2', 'str3'])
String.prototype.containsAny = String.prototype.containsAny || function(arr) {
	for (var i = 0; i < arr.length; i++) 
		if (this.indexOf(arr[i]) > -1) return true
	return false
}

// basic lodash template compilation
function render(view, ctx = {}) {
	return _.template(fs.readFileSync(`./views/${view}`))(ctx)
}

// start fastify server
fastify.listen(process.env.PORT, (err, address) => {
	if (err) throw err
	console.info(`server listening on ${address}`)
	fastify.log.info(`server listening on ${address}`)
})
