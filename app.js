require('dotenv').config()
const path = require('path')
const fetchGet = require('./lib/fetchGet')
const express = require('express')
const app = express()
app.disable('x-powered-by') // remove the 'X-Powered-By: Express' header
app.set('json spaces', 2) // basic pretty-print

// default to pug for rendering
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '/views'))


const RssItem = require('./lib/rssitem')

app.get('/r/:subreddit/time/:time/:limit', async (req, res) => {
	try {
		let subreddit = req.params.subreddit
		let time = req.params.time
		let limit = req.params.limit

		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`

		let json = await fetchGet(feed)
		let jsonArray = json.data.children 

		let rssObjects = []
		jsonArray.forEach((entry) => {
			let rss = new RssItem(entry)
			rssObjects.push(rss)
		})

		res.set('Content-Type', 'application/rss+xml')
		res.render('rss', {
			doctype:'xml',
			data: {
				subreddit: jsonArray[0].data.subreddit,
				link: jsonArray[0].data.subreddit,
				items: rssObjects
			}
		})
	} catch (ex) {
		console.error(ex)
	}

})


module.exports = app
