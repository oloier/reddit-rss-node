const _ = require('lodash')
const typy = require('typy')


const videoTemplate = (url) => {
	return '<iframe width=650 height=420 frameborder=0 '
	+ `src="https://oloier.com/r/v/${encodeURIComponent(url)}"></iframe>`
}

const videoReddit = (rdtItems, item) => {
	item.inline_video = ''

	if (item.post_hint && item.post_hint.indexOf(':video') !== -1) {
		if (item.is_reddit_video && item.reddit_video_url)
			item.content = videoTemplate(item.reddit_video_url)
		else item.content = _.unescape(item.secure_embed)
	}

	// individual other site exceptions, imgur, instagram, etc.
	if (item.post_hint && item.post_hint.indexOf('link') !== -1) {
		// replace gifv with <video> embed of mp4 source URL
		if (item.domain.indexOf('imgur.com') !== -1 && item.url.indexOf('.gifv' !== -1))
			item.content = videoTemplate(item.url.replace('.gifv', '.mp4'))
	}
	

}
